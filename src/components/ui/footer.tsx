export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-6 md:h-20 md:flex-row">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tutorji.in | All rights reserved.
          </p>
          
          {/* Navigation Links */}
          
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {/* Resources Links */}
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <a
              href="/suggest"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Suggestions
            </a>
          </nav>
          
          {/* Contact Email */}
          <div className="flex items-center gap-4">
            <a
              href="mailto:support@tutorji.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              support@tutorji.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}