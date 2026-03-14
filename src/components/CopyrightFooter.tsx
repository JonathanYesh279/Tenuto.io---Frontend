export default function CopyrightFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="shrink-0 border-t border-border/40 bg-card/50 backdrop-blur-sm w-full overflow-hidden">
      <div className="h-8 flex items-center" dir="ltr">
        <div className="animate-marquee whitespace-nowrap inline-block">
          <span className="text-xs text-muted-foreground px-4 inline-flex items-center gap-1.5">
            <span>©</span>
            <span>{year}</span>
            <span className="font-medium text-foreground/70">יהונתן ישעיהו</span>
            <span>•</span>
            <span>Tenuto.io</span>
            <span>•</span>
            <span>כל הזכויות שמורות</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
