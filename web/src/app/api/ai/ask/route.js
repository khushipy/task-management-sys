import sql from "@/app/api/utils/sql";

// AI Q&A about tasks
export async function POST(request) {
  try {
    const { projectId, question } = await request.json();
    
    if (!projectId || !question) {
      return Response.json({ error: 'Project ID and question are required' }, { status: 400 });
    }

    // Get project and tasks data
    const [project] = await sql`
      SELECT name, description FROM projects WHERE id = ${projectId}
    `;

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const tasks = await sql`
      SELECT t.id, t.title, t.description, c.name as column_name, t.created_date, t.updated_date
      FROM tasks t
      JOIN columns c ON t.column_id = c.id
      WHERE t.project_id = ${projectId}
      ORDER BY c.position, t.position
    `;

    // Prepare context for AI
    const tasksByColumn = {};
    tasks.forEach(task => {
      if (!tasksByColumn[task.column_name]) {
        tasksByColumn[task.column_name] = [];
      }
      tasksByColumn[task.column_name].push({
        id: task.id,
        title: task.title,
        description: task.description,
        created_date: task.created_date,
        updated_date: task.updated_date
      });
    });

    const context = `Project: ${project.name}
Description: ${project.description}

Tasks organized by status:
${Object.entries(tasksByColumn).map(([column, tasks]) => 
  `${column}:\n${tasks.map(task => 
    `- Task #${task.id}: ${task.title}\n  Description: ${task.description}\n  Created: ${task.created_date}\n  Updated: ${task.updated_date}`
  ).join('\n')}`
).join('\n\n')}`;

    // Call Gemini AI for Q&A
    const aiResponse = await fetch('/integrations/google-gemini-2-5-pro/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `You are an AI assistant helping with project management. Based on the following project and task information, please answer the user's question accurately and helpfully.

${context}

User Question: ${question}

Please provide a detailed and helpful answer based on the project data above. If the question is about specific tasks, reference them by their task ID and title. If you need more information to answer the question properly, let the user know what additional details would be helpful.`
        }]
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI service unavailable');
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    return Response.json({ answer, question });
  } catch (error) {
    console.error('Error processing question:', error);
    return Response.json({ error: 'Failed to process question' }, { status: 500 });
  }
}