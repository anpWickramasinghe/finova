import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client for storage
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

const supabase = createClient(supabaseUrl, supabaseKey);

// Use memoryStorage — file is kept in RAM so we can stream it to Supabase
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const ext = path.extname(req.file.originalname);
        const filename = `${uuidv4()}${ext}`;

        // Upload the buffer directly to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filename, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('Supabase Storage upload error:', error.message);
            return res.status(500).json({ message: 'Failed to upload file to storage', error: error.message });
        }

        // Build the public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        res.status(200).json({
            message: 'File uploaded successfully',
            url: publicUrlData.publicUrl,
            filename: data.path,
            originalName: req.file.originalname,
            size: req.file.size,
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Internal server error during upload' });
    }
};
