import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String },
    date: { type: Date, default: Date.now }
});

// Add a unique index on the `url` field
BlogSchema.index({ url: 1 }, { unique: true });

export const Blog = mongoose.model('Blog', BlogSchema);
