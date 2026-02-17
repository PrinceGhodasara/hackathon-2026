'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

type Project = {
  id: string
  name: string
}

export default function BoardsNav({ projects }: { projects: Project[] }) {
  const pathname = usePathname()

  return (
    <div className="pt-4">
      <div className="px-3 text-xs uppercase tracking-wide text-zinc-500">
        Boards
      </div>
      <details className="group mt-2" open>
        <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-100 bg-zinc-800">
          <span className="flex items-center gap-3">
            <LayoutGrid className="h-4 w-4 text-zinc-400" />
            Project Boards
          </span>
          <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2 space-y-2 pl-4">
          {projects.map((project) => {
            const boardPath = `/boards/${project.id}`
            const backlogPath = `/boards/${project.id}/backlog`
            const isProjectActive =
              pathname === boardPath ||
              pathname === backlogPath ||
              pathname.startsWith(`${boardPath}/`)
            const boardActive = pathname === boardPath
            const backlogActive = pathname === backlogPath
            return (
              <details key={project.id} className="group">
                <summary
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800',
                    isProjectActive && 'bg-zinc-800 text-zinc-100'
                  )}
                >
                  <span className="truncate">{project.name}</span>
                  <ChevronDown className="h-3 w-3 text-zinc-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-1 space-y-1 pl-4">
                  <Link
                    href={boardPath}
                    className={cn(
                      'block rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
                      boardActive && 'bg-zinc-800 text-zinc-100'
                    )}
                  >
                    Board
                  </Link>
                  <Link
                    href={backlogPath}
                    className={cn(
                      'block rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
                      backlogActive && 'bg-zinc-800 text-zinc-100'
                    )}
                  >
                    Backlog &amp; Sprints
                  </Link>
                </div>
              </details>
            )
          })}
          {projects.length === 0 && (
            <p className="px-2 py-1 text-xs text-zinc-500">No boards yet</p>
          )}
        </div>
      </details>
    </div>
  )
}
