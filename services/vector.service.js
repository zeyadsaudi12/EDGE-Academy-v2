/**
 * services/vector.service.js
 * التواصل مع ChromaDB لتخزين وإدارة الـ vectors الخاصة بوثائق EDGE Academy
 */

const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// اسم الـ collection في ChromaDB
const COLLECTION_NAME = 'edge_academy_docs';
const LOCAL_STORE_FILE = path.join(process.cwd(), 'uploads', 'vectors-store.json');

// عدد النتائج الافتراضي في البحث
const DEFAULT_K = 4;

// ─── Local Vector Store Helper (Fallback عندما يكون Docker مغلقاً) ─────────────
function loadLocalStore() {
    try {
        if (fs.existsSync(LOCAL_STORE_FILE)) {
            return JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf8'));
        }
    } catch (_) {}
    return [];
}

function saveLocalStore(records) {
    try {
        const dir = path.dirname(LOCAL_STORE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(records, null, 2), 'utf8');
    } catch (e) {
        console.error('[Vector Local Store] فشل الحفظ:', e.message);
    }
}

function cosineDistance(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 1;
    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, 1 - similarity);
}

// ─── Embedding Function باستخدام Google Gemini (مجاني) ───────────────────────
// نموذج: gemini-embedding-001
function getEmbeddingFunction() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY غير موجود في متغيرات البيئة');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    return {
        generate: async (texts) => {
            const embeddings = [];
            for (const text of texts) {
                const result = await model.embedContent(text);
                embeddings.push(result.embedding.values);
            }
            return embeddings;
        }
    };
}

// إنشاء ChromaDB client
function getClient() {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    return new ChromaClient({ path: chromaUrl });
}

/**
 * الحصول على الـ collection أو إنشاؤها إذا لم تكن موجودة
 * @returns {Promise<Collection>}
 */
async function getOrCreateCollection() {
    const client = getClient();
    const embeddingFn = getEmbeddingFunction();

    // getOrCreateCollection مع custom embedding function
    return await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: embeddingFn,
        metadata: { description: 'EDGE Academy RAG Documents — Google Gemini Embeddings' }
    });
}

/**
 * تخزين الـ chunks في ChromaDB مع fallback محلي تلقائي
 */
async function addDocuments(chunks, fileName) {
    if (!chunks || chunks.length === 0) {
        throw new Error('لا توجد chunks لتخزينها');
    }

    const embeddingFn = getEmbeddingFunction();
    const documents = chunks.map(c => c.pageContent);
    const embeddings = await embeddingFn.generate(documents);

    // 1. محاولة التخزين في ChromaDB
    try {
        const collection = await getOrCreateCollection();
        const ids = chunks.map((_, idx) => `${fileName}__chunk__${idx}__${Date.now()}`);
        const metadatas = chunks.map(c => c.metadata);

        const BATCH_SIZE = 50;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            await collection.add({
                ids: ids.slice(i, i + BATCH_SIZE),
                documents: documents.slice(i, i + BATCH_SIZE),
                metadatas: metadatas.slice(i, i + BATCH_SIZE)
            });
        }
        console.log(`[Vector] تم تخزين ${chunks.length} جزء في ChromaDB بنجاح`);
    } catch (chromaErr) {
        console.warn(`[Vector] تعذر الاتصال بـ ChromaDB (${chromaErr.message})، جاري التخزين في المخزن المحلي المدمج...`);
    }

    // 2. التخزين دائماً في المخزن المحلي المدمج لضمان العمل حتى بدون Docker
    const store = loadLocalStore().filter(item => item.metadata?.fileName !== fileName);
    chunks.forEach((chunk, idx) => {
        store.push({
            id: `${fileName}__chunk__${idx}`,
            pageContent: chunk.pageContent,
            metadata: chunk.metadata,
            embedding: embeddings[idx]
        });
    });
    saveLocalStore(store);
    console.log(`[Vector] تم حفظ ${chunks.length} جزء في المخزن المحلي.`);

    return { count: chunks.length };
}

/**
 * بحث دلالي مع fallback محلي تلقائي
 */
async function searchDocuments(query, k = DEFAULT_K) {
    if (!query || !query.trim()) {
        throw new Error('نص البحث فارغ');
    }

    // 1. محاولة البحث أولاً في ChromaDB
    try {
        const collection = await getOrCreateCollection();
        const count = await collection.count();
        if (count > 0) {
            const results = await collection.query({
                queryTexts: [query],
                nResults: Math.min(k, count)
            });

            if (results.documents && results.documents[0] && results.documents[0].length > 0) {
                return results.documents[0].map((doc, idx) => ({
                    pageContent: doc,
                    metadata: results.metadatas[0][idx] || {},
                    distance: results.distances ? results.distances[0][idx] : 1
                }));
            }
        }
    } catch (_) {
        // ChromaDB غير متاح، الانتقال للمخزن المحلي
    }

    // 2. البحث الدلالي في المخزن المحلي المدمج
    const store = loadLocalStore();
    if (!store || store.length === 0) {
        return [];
    }

    const embeddingFn = getEmbeddingFunction();
    const [queryEmbedding] = await embeddingFn.generate([query]);

    const scored = store.map(item => ({
        pageContent: item.pageContent,
        metadata: item.metadata || {},
        distance: cosineDistance(queryEmbedding, item.embedding)
    }));

    // الترتيب من الأقل مسافة (الأكثر تشابهاً)
    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, k);
}

/**
 * حذف جميع chunks الخاصة بملف معين
 */
async function deleteDocument(fileName) {
    try {
        const collection = await getOrCreateCollection();
        await collection.delete({ where: { fileName: fileName } });
    } catch (_) {}

    const store = loadLocalStore().filter(item => item.metadata?.fileName !== fileName);
    saveLocalStore(store);

    return { deleted: true };
}

/**
 * استرجاع قائمة بأسماء الملفات المُخزّنة
 */
async function listDocuments() {
    const fileNames = new Set();
    try {
        const collection = await getOrCreateCollection();
        const count = await collection.count();
        if (count > 0) {
            const results = await collection.get({ limit: 1000, include: ['metadatas'] });
            (results.metadatas || []).forEach(m => m.fileName && fileNames.add(m.fileName));
        }
    } catch (_) {}

    const store = loadLocalStore();
    store.forEach(item => item.metadata?.fileName && fileNames.add(item.metadata.fileName));

    return Array.from(fileNames);
}

module.exports = { addDocuments, searchDocuments, deleteDocument, listDocuments };

