import React, { useState } from 'react'

export default function Contact(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<{type: 'idle'|'success'|'error', message?: string}>({type:'idle'})

  async function submit(e: any){
    e.preventDefault()
    setStatus({type:'idle'})

    const API_BASE = (window as any).API_BASE || 'http://localhost:3000'

    try{
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      })
      const data = await res.json()
      if (res.ok && data.success){
        setStatus({type:'success', message: data.message || 'Thanks!'});
        setName(''); setEmail(''); setMessage('')
      } else {
        setStatus({type:'error', message: data.message || 'Submit failed'})
      }
    } catch(err){
      console.error(err)
      setStatus({type:'error', message: 'Network error'})
    }
  }

  return (
    <div className="py-20">
      <div className="container max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-300 mb-6">Send a message and we'll get back to you.</p>

        <form onSubmit={submit} className="space-y-4 bg-[rgba(255,255,255,0.02)] p-6 rounded-lg">
          <div>
            <label className="block mb-1">Name</label>
            <input value={name} onChange={(e: any)=>setName(e.target.value)} className="w-full p-3 rounded bg-transparent border border-[rgba(255,255,255,0.06)]" placeholder="Your name" required />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input type="email" value={email} onChange={(e: any)=>setEmail(e.target.value)} className="w-full p-3 rounded bg-transparent border border-[rgba(255,255,255,0.06)]" placeholder="your@email.com" required />
          </div>
          <div>
            <label className="block mb-1">Message</label>
            <textarea value={message} onChange={(e: any)=>setMessage(e.target.value)} className="w-full p-3 rounded bg-transparent border border-[rgba(255,255,255,0.06)] min-h-[140px]" placeholder="Your message..." required />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn primary">Send Message</button>
            {status.type === 'success' && <div className="text-green-300">{status.message}</div>}
            {status.type === 'error' && <div className="text-red-400">{status.message}</div>}
          </div>
        </form>
      </div>
    </div>
  )
}
