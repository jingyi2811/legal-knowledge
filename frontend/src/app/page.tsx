'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-center max-w-md w-full"
            >
                <div className="flex items-center justify-center mb-5">
                    <BookOpen className="h-10 w-10 text-blue-700" />
                </div>

                <h1 className="text-3xl font-bold text-gray-800">
                    Legal Knowledge
                </h1>
                <br/>
                <br/>
                <p className="text-gray-700 mb-6 text-base">
                    Ask legal questions and get instant, source‑grounded answers.
                </p>

                <br/>
                <br/>
                <Link
                    href="/chat"
                    className="inline-block bg-gradient-to-r from-blue-700 to-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:scale-105 transition-transform text-base"
                >
                    Go to Chat
                </Link>
            </motion.div>
        </div>
    );
}
