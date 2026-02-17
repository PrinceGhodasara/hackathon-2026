'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import FullScreenLoader from '@/components/full-screen-loader'

type Member = {
  id: string
  email: string | null
  role: 'admin' | 'member'
}

type Project = {
  id: string
  name: string
  description: string | null
}

type SuperAdminPanelProps = {
  members: Member[]
  projects: Project[]
}

export default function SuperAdminPanel({
  members,
  projects,
}: SuperAdminPanelProps) {
  const [createUserMessage, setCreateUserMessage] = useState<string | null>(null)
  const [createProjectMessage, setCreateProjectMessage] = useState<string | null>(
    null
  )
  const [assignMessage, setAssignMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateUserMessage(null)
    setIsLoading(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setCreateUserMessage(data.error || 'Member created.')
      if (response.ok) {
        toast.success('Member created.')
      } else {
        toast.error(data.error || 'Unable to create member.')
      }
      if (response.ok) {
        form.reset()
      }
    } catch {
      setCreateUserMessage('Unable to create member.')
      toast.error('Unable to create member.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setCreateProjectMessage(null)
    setIsLoading(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()

    try {
      const response = await fetch('/api/admin/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      const data = await response.json()
      setCreateProjectMessage(data.error || 'Project created.')
      if (response.ok) {
        toast.success('Project created.')
      } else {
        toast.error(data.error || 'Unable to create project.')
      }
      if (response.ok) {
        form.reset()
      }
    } catch {
      setCreateProjectMessage('Unable to create project.')
      toast.error('Unable to create project.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignMember = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setAssignMessage(null)
    setIsLoading(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const projectId = String(formData.get('projectId') || '')
    const userId = String(formData.get('userId') || '')

    try {
      const response = await fetch('/api/admin/assign-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId }),
      })

      const data = await response.json()
      setAssignMessage(data.error || 'Member assigned.')
      if (response.ok) {
        toast.success('Member assigned.')
      } else {
        toast.error(data.error || 'Unable to assign member.')
      }
      if (response.ok) {
        form.reset()
      }
    } catch {
      setAssignMessage('Unable to assign member.')
      toast.error('Unable to assign member.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      {isLoading && <FullScreenLoader label="Processing..." />}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <h2 className="text-lg font-semibold">Admin Console</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Manage users, projects, and assignments from one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          className="rounded-xl border border-zinc-800 bg-zinc-800 p-5 space-y-4"
          onSubmit={handleCreateUser}
        >
          <h3 className="text-base font-semibold">Register Member</h3>
          <div>
            <label className="text-sm text-zinc-400" htmlFor="member-email">
              Email
            </label>
            <input
              id="member-email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="member@company.com"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400" htmlFor="member-password">
              Password
            </label>
            <input
              id="member-password"
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold"
          >
            Create Member
          </button>
          {createUserMessage && (
            <p className="text-xs text-zinc-400">{createUserMessage}</p>
          )}
        </form>

        <form
          className="rounded-xl border border-zinc-800 bg-zinc-800 p-5 space-y-4"
          onSubmit={handleCreateProject}
        >
          <h3 className="text-base font-semibold">Create Project</h3>
          <div>
            <label className="text-sm text-zinc-400" htmlFor="project-name">
              Name
            </label>
            <input
              id="project-name"
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="Roadmap 2026"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400" htmlFor="project-desc">
              Description
            </label>
            <textarea
              id="project-desc"
              name="description"
              rows={3}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              placeholder="What this project covers"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold"
          >
            Add Project
          </button>
          {createProjectMessage && (
            <p className="text-xs text-zinc-400">{createProjectMessage}</p>
          )}
        </form>

        <form
          className="rounded-xl border border-zinc-800 bg-zinc-800 p-5 space-y-4"
          onSubmit={handleAssignMember}
        >
          <h3 className="text-base font-semibold">Assign Member</h3>
          <div>
            <label className="text-sm text-zinc-400" htmlFor="assign-project">
              Project
            </label>
            <select
              id="assign-project"
              name="projectId"
              required
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400" htmlFor="assign-member">
              Member
            </label>
            <select
              id="assign-member"
              name="userId"
              required
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select member
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.email || member.id} ({member.role})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold"
          >
            Assign
          </button>
          {assignMessage && (
            <p className="text-xs text-zinc-400">{assignMessage}</p>
          )}
        </form>
      </div>
    </section>
  )
}
