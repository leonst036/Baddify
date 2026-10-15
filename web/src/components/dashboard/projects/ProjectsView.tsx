import { useState } from 'react'
import { ProjectsHeader } from './ProjectsHeader'
import { Footer } from '../../footer/footer'

export function ProjectsView() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <ProjectsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Footer />
    </>
  )
}

export default ProjectsView
