'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Blog {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  author: string;
  image?: string;
  createdAt: string;
  keywords?: string[];
}

export default function BlogPost() {
  const params = useParams();
  const slug = params?.slug as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blogs/${slug}`);
      const data = await response.json();
      if (data.success && data.data) {
        setBlog(data.data);
      } else {
        setError('Blog post not found');
      }
    } catch (err) {
      setError('Failed to fetch blog post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg mb-4">{error || 'Blog post not found'}</p>
            <Link
              href="/blog"
              className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <span className="text-red-100">
              {new Date(blog.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {blog.title}
          </h1>
          <p className="text-red-100">By {blog.author}</p>
        </div>
      </section>

      {/* Featured Image */}
      {blog.image && (
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed mb-8">
              {blog.description && (
                <p className="text-xl text-gray-600 mb-6 italic border-l-4 border-red-600 pl-4">
                  {blog.description}
                </p>
              )}
            </div>

            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {blog.keywords && blog.keywords.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blog.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Back Button */}
          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-semibold"
            >
              ← Back to blog
            </Link>
          </div>
        </div>
      </section>

      {/* Related Posts CTA */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Want to connect with verified escorts?
          </h2>
          <Link
            href="/providers"
            className="inline-block px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            Browse Providers
          </Link>
        </div>
      </section>
    </div>
  );
}