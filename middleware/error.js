const PUBLIC_MESSAGE = 'حدث خطأ داخلي في السيرفر';

function isProduction() {
    return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

// Multer errors are client errors, not server failures.
function statusFor(err) {
    if (err && err.name === 'MulterError') return 400;
    if (err && Number.isInteger(err.status) && err.status >= 400 && err.status < 600) return err.status;
    if (err && err.name === 'ValidationError') return 400;
    if (err && err.name === 'CastError') return 400;
    return 500;
}

const errorHandler = (err, req, res, next) => {
    const status = statusFor(err);
    // Log server faults with a stack; expected client mistakes only need a
    // one-line warning so the logs stay useful.
    if (status >= 500) {
        console.error('❌ Error caught by handler:', err.stack || err);
    } else {
        console.warn('⚠️ Rejected request:', req.method, req.originalUrl, '-', err.message);
    }

    if (res.headersSent) return next(err);

    const message = status >= 500 && isProduction()
        ? PUBLIC_MESSAGE
        : (err.message || PUBLIC_MESSAGE);

    res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
