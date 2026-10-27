function clean(value) {
    if (typeof value === 'string') return value.replace(/[<>]/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) {
            // Mongo operators and dotted keys must never originate from a client.
            if (key.startsWith('$') || key.includes('.')) delete value[key];
            else value[key] = clean(value[key]);
        }
    }
    return value;
}

module.exports = (req, _res, next) => {
    if (req.body) clean(req.body);
    next();
};
