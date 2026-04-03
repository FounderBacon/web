export function Footer() {
  return (
    <footer className="flex items-center justify-center border-t border-border px-8 py-6">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} FounderBacon
      </p>
    </footer>
  )
}
