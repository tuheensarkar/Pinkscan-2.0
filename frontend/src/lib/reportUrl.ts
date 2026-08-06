const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "")

export function getReportUrl(path?: string | null): string | null {
    if (!path) return null
    if (path.startsWith("http")) return path
    return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}
