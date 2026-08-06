"use client"

import { useCallback, useEffect, useState } from "react"
import { BadgeCheck, ChevronDown, ChevronUp, Loader2, MessageCircle, Plus, Send, Users } from "lucide-react"
import { api } from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"

type Comment = {
    id: number
    content: string
    is_verified_answer: boolean
    created_at: string
    author: { email: string; full_name: string | null; role: string }
}

type Post = {
    id: number
    title: string
    content: string
    created_at: string
    author: { email: string; full_name: string | null; role: string }
    comments: Comment[]
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

export default function CommunityPage() {
    const { checkAuth } = useAuthStore()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: "", content: "" })
    const [submitting, setSubmitting] = useState(false)
    const [expandedPost, setExpandedPost] = useState<number | null>(null)
    const [commentText, setCommentText] = useState<Record<number, string>>({})
    const [commentLoading, setCommentLoading] = useState<number | null>(null)

    useEffect(() => { checkAuth() }, [checkAuth])

    const fetchPosts = useCallback(async () => {
        try {
            const res = await api.get("/community/posts")
            setPosts(res.data)
        } catch {
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { queueMicrotask(() => { fetchPosts() }) }, [fetchPosts])

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await api.post("/community/posts", form)
            setForm({ title: "", content: "" })
            setShowForm(false)
            fetchPosts()
        } catch {
        } finally {
            setSubmitting(false)
        }
    }

    const handleComment = async (postId: number) => {
        const content = commentText[postId]?.trim()
        if (!content) return
        setCommentLoading(postId)
        try {
            await api.post(`/community/posts/${postId}/comments`, { content })
            setCommentText(prev => ({ ...prev, [postId]: "" }))
            fetchPosts()
        } catch {
        } finally {
            setCommentLoading(null)
        }
    }

    return (
        <div className="app-shell flex min-h-screen">
            <Sidebar />
            <main className="ml-72 flex-1 p-8">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="eyebrow">Community support</p>
                            <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Questions, experience, and clinician context</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                                Use this space for practical questions and support. Urgent symptoms still belong with a healthcare professional.
                            </p>
                        </div>
                        <Button onClick={() => setShowForm(!showForm)} className="rounded-md bg-teal text-white hover:bg-teal/90">
                            <Plus className="mr-2 h-4 w-4" />New post
                        </Button>
                    </header>

                    {showForm && (
                        <section className="patient-surface mb-6 rounded-lg p-6">
                            <h2 className="font-display text-2xl font-semibold text-ink">Start a careful conversation</h2>
                            <form onSubmit={handleCreatePost} className="mt-5 space-y-4">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-ink">Question or topic</span>
                                    <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Example: What should I ask at my follow-up appointment?" className="form-field w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/35" />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-ink">Details</span>
                                    <textarea rows={4} required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Share only what you are comfortable sharing." className="form-field w-full resize-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/35" />
                                </label>
                                <div className="flex gap-3">
                                    <Button type="submit" disabled={submitting} className="bg-teal text-white hover:bg-teal/90">
                                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Post
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                </div>
                            </form>
                        </section>
                    )}

                    {loading ? (
                        <div className="clinical-surface flex h-64 items-center justify-center rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-teal" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="patient-surface rounded-lg p-10">
                            <Users className="h-7 w-7 text-teal" />
                            <h2 className="mt-5 font-display text-3xl font-semibold text-ink">No conversations yet.</h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                                Start with a practical question: preparing for screening, understanding a report, or what to ask a doctor.
                            </p>
                            <Button onClick={() => setShowForm(true)} className="mt-5 bg-teal text-white hover:bg-teal/90">
                                Create first post
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isExpanded = expandedPost === post.id
                                const authorName = post.author.full_name || post.author.email
                                return (
                                    <article key={post.id} className="patient-surface overflow-hidden rounded-lg">
                                        <div className="p-5">
                                            <div className="flex gap-4">
                                                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-paper text-sm font-bold text-teal">
                                                    {authorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold text-ink">{authorName}</span>
                                                        {post.author.role === "doctor" && <DoctorMark />}
                                                        <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                                                    </div>
                                                    <h2 className="mt-2 text-xl font-semibold text-ink">{post.title}</h2>
                                                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{post.content}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setExpandedPost(isExpanded ? null : post.id)} className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-slate-600 hover:border-teal/40 hover:text-teal">
                                                <MessageCircle className="h-4 w-4" />
                                                {post.comments.length} repl{post.comments.length === 1 ? "y" : "ies"}
                                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="border-t border-border bg-card/65 p-5">
                                                <div className="space-y-4">
                                                    {post.comments.map((comment) => {
                                                        const commentAuthor = comment.author.full_name || comment.author.email
                                                        return (
                                                            <div key={comment.id} className={`rounded-lg border p-4 ${comment.is_verified_answer ? "border-teal/30 bg-scrub" : "border-border bg-paper/70"}`}>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-semibold text-ink">{commentAuthor}</span>
                                                                    {comment.author.role === "doctor" && <DoctorMark />}
                                                                    {comment.is_verified_answer && <span className="text-xs font-bold text-teal">Verified answer</span>}
                                                                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                                                                </div>
                                                                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{comment.content}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <div className="mt-5 flex gap-2">
                                                    <input value={commentText[post.id] || ""} onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(post.id) } }}
                                                        placeholder="Write a thoughtful reply..."
                                                        className="form-field flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/35" />
                                                    <Button size="sm" onClick={() => handleComment(post.id)} disabled={commentLoading === post.id} className="bg-teal text-white hover:bg-teal/90">
                                                        {commentLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function DoctorMark() {
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-scrub px-2 py-0.5 text-xs font-bold text-teal">
            <BadgeCheck className="h-3 w-3" />Doctor
        </span>
    )
}
