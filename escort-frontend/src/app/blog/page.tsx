'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Blog {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  author: string;
  image?: string;
  createdAt: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blogs`);
      const data = await response.json();
      if (data.success && data.data) {
        setBlogs(data.data);
      }
    } catch (err) {
      setError('Failed to fetch blogs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Escorthub254 Blog
          </h1>
          <p className="text-xl text-red-100">
            Tips, guides, and insights about escort services in Nairobi
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
              {error}
            </div>
          )}

          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-600 mb-4">No blog posts yet</p>
              <p className="text-gray-500">Check back soon for updates</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-8">
                Showing <span className="font-bold text-red-600">{blogs.length}</span> blog post{blogs.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <Link key={blog.id} href={`/blog/${blog.slug}`}>
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow h-full overflow-hidden cursor-pointer group">
                      {blog.image && (
                        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full">
                            {blog.category}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                          {blog.title}
                        </h2>
                        <p className="text-gray-600 mb-4 flex-1 line-clamp-2">
                          {blog.description}
                        </p>
                        <span className="text-red-600 font-semibold">Read more →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
