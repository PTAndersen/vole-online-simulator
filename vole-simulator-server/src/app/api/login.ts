// src/app/api/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
console.log("login.ts");
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Assume you're receiving JSON with an email and password
        const { email, password } = req.body;
        
        // Dummy check against hardcoded credentials
        if (email === 'user@example.com' && password === 'password') {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
