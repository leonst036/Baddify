
import { useState } from 'react'
import { Footer } from '../footer/footer'
import { Sidebar } from '../dashboard'

export function NewProjects() {
    const [activeNav, setActiveNav] = useState(1)

    return (
        <>
            <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />
            <Footer />
        </>
    )
}

export default NewProjects
