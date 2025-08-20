export default function Loading() {
  return (
    <div className="min-h-screen glass-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Skeleton */}
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="aspect-square glass-skeleton"></div>
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-20 h-20 glass-skeleton rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            <div>
              <div className="h-8 glass-skeleton mb-4 w-3/4"></div>
              <div className="h-6 glass-skeleton mb-4 w-1/2"></div>
              <div className="h-12 glass-skeleton mb-6 w-1/3"></div>
              <div className="h-20 glass-skeleton mb-6"></div>
            </div>

            <div className="glass-card p-6">
              <div className="h-32 glass-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
