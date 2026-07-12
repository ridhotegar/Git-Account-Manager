import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const techStack = [
  { name: "Rust", description: "Backend runtime" },
  { name: "Tauri", description: "Desktop framework" },
  { name: "React", description: "UI library" },
  { name: "TypeScript", description: "Type safety" },
  { name: "SQLite", description: "Local database" },
  { name: "TailwindCSS", description: "Styling" },
  { name: "shadcn/ui", description: "Component library" },
];

const team = [
  {
    name: "Git Account Manager",
    role: "Open Source Project",
  },
];

export function About() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4">
          G
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Git Account Manager
        </h2>
        <p className="text-muted-foreground">
          Version 0.1.0 · Built with Rust + Tauri
        </p>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            A modern cross-platform desktop application for managing multiple
            Git identities and accounts. Switch between accounts, manage
            credentials, and keep your Git workflows organized.
          </p>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Technology Stack</h3>
          <div className="grid grid-cols-2 gap-3">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background text-xs font-bold text-primary">
                  {tech.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tech.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <div className="flex justify-center gap-4">
        <Badge variant="secondary" className="cursor-pointer">
          <ExternalLink className="mr-1 h-3 w-3" />
          GitHub Repository
        </Badge>
        <Badge variant="secondary" className="cursor-pointer">
          <ExternalLink className="mr-1 h-3 w-3" />
          Documentation
        </Badge>
        <Badge variant="secondary" className="cursor-pointer">
          <ExternalLink className="mr-1 h-3 w-3" />
          Report Issue
        </Badge>
      </div>

      {/* License */}
      <p className="text-center text-xs text-muted-foreground">
        MIT License · Copyright &copy; 2026 Git Account Manager
      </p>
    </div>
  );
}
