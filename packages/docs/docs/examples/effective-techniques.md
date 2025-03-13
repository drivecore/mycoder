---
title: Effective Prompting Techniques
description: Key patterns and strategies for getting the best results from MyCoder
---

# Effective Prompting Techniques

After analyzing numerous successful MyCoder interactions, we've identified several key techniques that consistently lead to effective results. This page outlines these techniques to help you craft better prompts for your own projects.

## Using GitHub as External Memory

One of the most powerful techniques is using GitHub as a persistent external memory store for your project. This approach provides several benefits:

### Why This Works

- **Maintains Context:** GitHub issues, PRs, and commits create a persistent record that MyCoder can reference
- **Tracks Evolution:** Changes over time are documented and accessible
- **Structures Work:** Breaking work into issues and PRs creates natural task boundaries
- **Enables Collaboration:** Both humans and MyCoder can reference and build upon the same information

### Implementation Techniques

1. **Create Issues for Tasks:** Break work into discrete issues that MyCoder can reference by number
2. **Reference Issue Numbers:** Use `#issue-number` in your prompts to give MyCoder context
3. **Link Related Work:** Reference previous PRs or issues when asking for related work
4. **Document Decisions:** Use issue comments to record decisions and rationale

## Clear Task Definition

Clearly defining tasks helps MyCoder understand exactly what you need.

### Why This Works

- **Reduces Ambiguity:** Explicit instructions minimize misunderstandings
- **Sets Expectations:** Clear deliverables help MyCoder know when it's done
- **Provides Context:** Background information helps MyCoder make better decisions

### Implementation Techniques

1. **Specify Deliverables:** Clearly state what you expect (e.g., \"create a GitHub issue and PR\")
2. **Provide Rationale:** Explain why you want something done a certain way
3. **Set Boundaries:** Define what's in scope and out of scope
4. **Reference Examples:** Point to existing code or documentation as examples

## Breaking Down Complex Tasks

Complex tasks are more manageable when broken into smaller pieces.

### Why This Works

- **Simplifies Implementation:** Smaller tasks are easier to understand and implement
- **Enables Verification:** You can verify each piece before moving to the next
- **Improves Quality:** Focused work typically results in better quality

### Implementation Techniques

1. **Create Multiple Issues:** Break large features into multiple GitHub issues
2. **Implement Incrementally:** Ask MyCoder to implement one piece at a time
3. **Verify Incrementally:** Check each implementation before moving forward
4. **Build Complexity Gradually:** Start with core functionality, then add refinements

## Providing References and Examples

Pointing MyCoder to existing code or documentation helps it understand your preferred approach.

### Why This Works

- **Maintains Consistency:** References help ensure new code matches existing patterns
- **Reduces Explanation Needed:** Examples often communicate better than descriptions
- **Leverages Existing Knowledge:** MyCoder can adapt patterns it sees in your codebase

### Implementation Techniques

1. **Reference Similar Code:** Point to similar implementations in your codebase
2. **Provide File Paths:** Be specific about where to find reference implementations
3. **Highlight Key Patterns:** Call attention to specific aspects of the examples
4. **Cross-Repository References:** Reference patterns from other repositories when applicable

## Iterative Refinement

Iterative feedback and refinement often leads to better results than trying to get everything perfect in one go.

### Why This Works

- **Builds Understanding:** Each iteration helps MyCoder better understand your needs
- **Focuses Feedback:** You can address specific aspects in each iteration
- **Improves Quality:** Progressive refinement typically leads to better outcomes

### Implementation Techniques

1. **Start Simple:** Begin with a basic implementation
2. **Provide Specific Feedback:** Focus on particular aspects to improve
3. **Acknowledge Progress:** Recognize what's working well
4. **Build on Success:** Use successful patterns as references for future work
