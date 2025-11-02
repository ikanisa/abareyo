# GitHub Copilot Custom Agents

This directory contains custom GitHub Copilot agent definitions for the Rayon Sports Digital Platform.

## Available Agents

### Code Review Agent (`code-review.yml`)

A comprehensive code review agent that acts as a senior software engineer to provide thorough, constructive feedback on code changes.

#### Purpose

Performs in-depth code reviews covering:
- **Security**: Input validation, auth, data exposure, injection vulnerabilities
- **Performance**: Algorithm complexity, memory usage, database optimization
- **Code Quality**: Readability, naming, duplication, maintainability
- **Architecture**: Design patterns, separation of concerns, error handling
- **Testing & Documentation**: Test coverage, docs completeness, API documentation

#### Usage

When invoking the code review agent, you can optionally provide a focus area:

```
@copilot /code-review [focus area]
```

Examples:
- `@copilot /code-review security` - Focus on security issues
- `@copilot /code-review performance` - Focus on performance optimizations
- `@copilot /code-review` - General comprehensive review

#### Output Format

The agent provides structured feedback in three categories:

- **🔴 Critical Issues**: Must fix before merge (security, breaking changes, data risks)
- **🟡 Suggestions**: Improvements to consider (quality, performance, patterns)
- **✅ Good Practices**: Highlights well-written code

Each issue includes:
- Specific file and line references
- Clear problem explanation and impact
- Suggested solution with code example
- Rationale for the change

#### Context-Aware Reviews

The agent is aware of the project stack and checks for:
- Next.js 14 App Router patterns and Server/Client Component usage
- TypeScript type safety and proper generics
- Supabase integration and error handling
- Security best practices (env vars, API protection, sanitization)
- Performance optimizations (bundle size, lazy loading, images)
- Accessibility standards (ARIA, keyboard nav, semantic HTML)

#### Best Practices

- Use the agent for all significant code changes before PR submission
- Provide specific focus areas when you want targeted feedback
- Review all Critical Issues first, then Suggestions
- Use the agent iteratively as you address feedback
- The agent follows conventions from `.github/copilot-instructions.md`

## Adding New Agents

To add a new custom agent:

1. Create a new `.yml` file in this directory
2. Add YAML frontmatter with `mode: 'agent'` and a description
3. Write the agent prompt in Markdown below the frontmatter
4. Include clear instructions, expected behavior, and output format
5. Add documentation to this README
6. Test the agent with representative code samples

## Agent Development Guidelines

- Keep prompts clear, specific, and actionable
- Use consistent formatting and structure
- Include examples and code snippets where helpful
- Consider the project context and tech stack
- Balance thoroughness with practicality
- Make output formats scannable and easy to act on
