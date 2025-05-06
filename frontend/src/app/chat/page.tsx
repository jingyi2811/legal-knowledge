'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    title: string;
    content: string;
    sourceFile: string;
    pageNumber: number;
    distance: number;
  }[];
};

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setConversation(prev => [...prev, { role: 'user', content: query }]);

    try {
      const res = await fetch('http://localhost:4000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      setConversation(prev => {
        const withoutAssistant = prev.filter(m => m.role !== 'assistant');
        return [...withoutAssistant, { role: 'assistant', content: data.answer, sources: data.sources }];
      });

      setQuery('');
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <main className="flex min-h-screen flex-col items-center p-8 sm:p-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-all">
        <div className="w-full max-w-4xl font-sans text-sm">

          <br/>
          <br/>

          <h1 className="text-4xl font-bold mb-10 text-center text-gray-800 dark:text-white">
            Legal Chat Assistant
          </h1>

          <br/>
          <br/>

          {conversation.slice(-2).map((message, index) => (
              <div
                  key={index}
                  className={`mx-auto w-[80%] p-4`}
              >
                {!isLoading &&
                <p className="whitespace-pre-wrap">{message.content}</p>
                }

                {/*{message.sources && (*/}
                {/*    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">*/}
                {/*      <strong>Sources:</strong>*/}
                {/*      <ul className="list-disc pl-5 mt-1">*/}
                {/*        {message.sources.map((source, idx) => (*/}
                {/*            <li key={idx}>*/}
                {/*              {source.title} (Page {source.pageNumber})*/}
                {/*            </li>*/}
                {/*        ))}*/}
                {/*      </ul>*/}
                {/*    </div>*/}
                {/*)}*/}
              </div>
          ))}

          <br/>

          {/* Conversation history (optional, still kept if you want to render it) */}
          {/* Error message */}
          {error && (
              <div className="mt-4 text-red-600 dark:text-red-400 text-center">
                {error}
              </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="mt-8">
          <textarea
              value={query}
              onChange={handleChange}
              placeholder="Type your legal question here..."
              rows={10}
              className="w-[80%] mx-auto block p-4 border rounded-md pt-4 pl-4 pr-6 pb-4 border-2"
              disabled={isLoading}
          />
            <br/>
            <br />
            <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="block mx-auto px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                  'Thinking…'
              ) : (
                  <span className="inline-flex items-center gap-2 justify-center">
                <Send className="w-4 h-4" /> Send
              </span>
              )}
            </button>
          </form>

          <br/>

          <div className="mt-12 text-center">
            <Link href="/" className="text-blue-500 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
  );
}
