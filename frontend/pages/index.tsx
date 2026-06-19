import Head from 'next/head'
import Link from 'next/link'

export default function Home(){
  return (
    <>
      <Head>
        <title>My Website — Home</title>
        <meta name="description" content="Modern website with features, videos and web series." />
      </Head>

      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Modern, fast & beautiful web experiences</h1>
              <p className="text-gray-300 mb-6">Built with Next.js, Tailwind, Firebase Auth, MySQL and Stripe for payments. Explore features, videos and more.</p>

              <div className="flex gap-3">
                <Link href="/features" className="btn primary">See Features</Link>
                <Link href="/videos" className="btn outline">Videos</Link>
              </div>
            </div>
            <div className="bg-[rgba(255,255,255,0.02)] p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Featured</h3>
              <ul className="text-gray-300 list-disc pl-5 space-y-2">
                <li>Fast server-side rendering</li>
                <li>Progressive enhancement & accessibility</li>
                <li>Payments and user accounts ready</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
