import { useState } from 'react'
import { ProjectsHeader } from './ProjectsHeader'
import { Footer } from '../../footer/footer'
import { NewProjects } from '../../projects/NewProjects'

interface ProjectsViewProps {
  isCreating?: boolean
  onToggleCreating?: (creating: boolean) => void
}

export function ProjectsView({
  isCreating: externalIsCreating,
  onToggleCreating,
}: ProjectsViewProps = {}) {
  const [internalIsCreating, setInternalIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isCreating = externalIsCreating !== undefined ? externalIsCreating : internalIsCreating
  const setIsCreating = onToggleCreating || setInternalIsCreating

  if (isCreating) {
    return <NewProjects onBack={() => setIsCreating(false)} />
  }

  return (
    <>
      <ProjectsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewProject={() => setIsCreating(true)}
      />
      <Footer />
    </>
  )
}

export default ProjectsView
