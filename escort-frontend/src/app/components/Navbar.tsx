
'use client';

import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
    return(
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src="/Logo.png" alt="Logo" width={200} height={90} />
                            <span className="text-2xl"></span>
                            <span className="ml-2 text-xl font-bold text-red-700">Nairobi Escorts</span>
                        </Link>
                    </div>

                    {/* RIGHT SIDE: Navigation Links */}
                    <div className="flex items-center space-x-4 md:space-x-8">

                        {/* Home Link */}
                        <Link href="/" className="text-red-700 hover:text-blue-600 font-medium transition-colors"> Home </Link>

                        {/* Signin In Link */}
                        <Link href="/Login" className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"> Login</Link>

                        {/* Register Link */}
                        <Link href="/register" className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"> Register </Link>

                        {/* About */}
                        <Link href="/about" className="text-red-700 hover:text-blue-600 font-medium transition-colors"> About </Link>
                         
                    </div>
                </div>
            </div>
        </nav>
    )
}