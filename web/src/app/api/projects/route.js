import sql from "@/app/api/utils/sql";

// Get all projects
export async function GET() {
  try {
    const projects = await sql`
      SELECT id, name, description, created_date 
      FROM projects 
      ORDER BY created_date DESC
    `;
    
    return Response.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// Create a new project
export async function POST(request) {
  try {
    const { name, description } = await request.json();
    
    if (!name) {
      return Response.json({ error: 'Project name is required' }, { status: 400 });
    }

    const [project] = await sql`
      INSERT INTO projects (name, description)
      VALUES (${name}, ${description || ''})
      RETURNING id, name, description, created_date
    `;

    // Create default columns for the new project
    await sql`
      INSERT INTO columns (project_id, name, position)
      VALUES 
        (${project.id}, 'To Do', 1),
        (${project.id}, 'In Progress', 2),
        (${project.id}, 'Done', 3)
    `;

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ error: 'Failed to create project' }, { status: 500 });
  }
}