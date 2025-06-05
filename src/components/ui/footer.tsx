import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-6 md:h-20 md:flex-row px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tutorji.in | All rights reserved.
          </p>
          
          {/* Navigation Links */}
          
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {/* Resources Links */}
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/suggest"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Suggestions
            </Link>
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