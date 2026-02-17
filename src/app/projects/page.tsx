import ProjectsPanel from '@/components/projects-panel'
import { createClient } from '@/lib/supabase/server'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    : { data: null }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description')
    .order('created_at', { ascending: false })

  const canCreate = profile?.role === 'admin'

  const { data: members } = canCreate
    ? await supabase.from('profiles').select('id, email, role').order('email')
    : { data: [] }

  const { data: projectMembers } = canCreate
    ? await supabase.from('project_members').select('project_id, user_id')
    : { data: [] }

  return (
    <ProjectsPanel
      initialProjects={projects || []}
      canCreate={canCreate}
      members={members || []}
      projectMembers={projectMembers || []}
    />
  )
}
