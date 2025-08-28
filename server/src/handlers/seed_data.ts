import { type CreateEngineeringLevelInput, type CreateLevelCriterionInput } from '../schema';

// Sample seed data based on the specification
export const seedEngineeringLevels: CreateEngineeringLevelInput[] = [
    {
        id: "L1/L2",
        title: "L1/L2",
        job_title: null,
        one_sentence_description: "Entry level engineer learning fundamentals and contributing to small tasks",
        scope_of_influence_summary: "Themselves and their tasks",
        ownership_summary: "No ownership responsibility. Learning and being actively developed by others",
        trajectory_notes: "Expected to progress to L3 within 1-2 years"
    },
    {
        id: "L3",
        title: "L3",
        job_title: null,
        one_sentence_description: null,
        scope_of_influence_summary: "Their area and strategy",
        ownership_summary: "Consistent record of very strong ownership for their area. Accountable for results in that area.",
        trajectory_notes: "We expect Engineers to remain at this level for 2 years on average"
    },
    {
        id: "L5",
        title: "L5",
        job_title: null,
        one_sentence_description: "Leads projects and some cross-team efforts inside their team. An expert in the areas owned by their team. Mentors and guides juniors",
        scope_of_influence_summary: "industry",
        ownership_summary: "Fully responsible for all aspects of their area. This person is rare. This takes an exceptional level of dedication to the craft and is a big jump from Level 4. Very few companies will have someone at this skill level.",
        trajectory_notes: "Progression beyond this level is optional. L5 Engineers may follow the IC track (L6) or TL path (Lead Engineer)"
    },
    {
        id: "EM1",
        title: "EM1",
        job_title: "Engineering Manager",
        one_sentence_description: "An Eng Manager supports Lead Engineers, and is responsible for technical decisions and outcomes on their teams (target max reports: 3 TLs)",
        scope_of_influence_summary: null,
        ownership_summary: null,
        trajectory_notes: "Promotion to EM and above requires there to be a business need for the role"
    }
];

export const seedLevelCriteria: CreateLevelCriterionInput[] = [
    // L3 criteria
    {
        engineering_level_id: "L3",
        category: "Craft",
        sub_category: "Technical Expertise",
        description: "Has sufficient practical and foundational knowledge to be able to understand and implement features with guidance. Learns best-practices and tools"
    },
    {
        engineering_level_id: "L3",
        category: "Craft",
        sub_category: "Scope",
        description: "Owns tasks and small projects"
    },
    {
        engineering_level_id: "L3",
        category: "Impact",
        sub_category: "Planning",
        description: "Plans execution of their tasks to reliably deliver changes."
    },
    {
        engineering_level_id: "L3",
        category: "Impact",
        sub_category: "Execution",
        description: "Completes individual tasks or small features independently in a timely fashion; is productive and seeks support from team-members"
    },
    {
        engineering_level_id: "L3",
        category: "Growth",
        sub_category: "Mentoring & Feedback",
        description: "Open to guidance and mentorship from others. Provides feedback to peers and Lead Eager to learn and expand responsibilities"
    },
    // L5 criteria
    {
        engineering_level_id: "L5",
        category: "Craft",
        sub_category: "Technical Expertise",
        description: "A domain expert. Able to contribute across many teams areas of expertise. Follows relevant research Raises the bar of what we can achieve."
    },
    {
        engineering_level_id: "L5",
        category: "Craft",
        sub_category: "Scope",
        description: "Large systems, aware of APIs and responsibility-boundaries between services"
    },
    {
        engineering_level_id: "L5",
        category: "Impact",
        sub_category: "Planning",
        description: "Writes specs and scopes tasks for large systems and work break down for several people. Able to create RFCs and negotiate with stakeholders"
    },
    {
        engineering_level_id: "L5",
        category: "Impact",
        sub_category: "Execution",
        description: "Can lead a medium or large project, supporting team members with guidance from their Lead Makes good decisions on prioritization"
    },
    {
        engineering_level_id: "L5",
        category: "Growth",
        sub_category: "Mentoring & Feedback",
        description: "Mentors new hires and peers; other team members look up to their technical expertise to solve their challenges"
    },
    // EM1 criteria
    {
        engineering_level_id: "EM1",
        category: "Craft",
        sub_category: "Technical Expertise",
        description: "As L5+"
    },
    {
        engineering_level_id: "EM1",
        category: "Craft",
        sub_category: "Scope",
        description: "Owns the problem-domain of their teams"
    },
    {
        engineering_level_id: "EM1",
        category: "Impact",
        sub_category: "Planning",
        description: null
    },
    {
        engineering_level_id: "EM1",
        category: "Impact",
        sub_category: "Execution",
        description: null
    },
    {
        engineering_level_id: "EM1",
        category: "Growth",
        sub_category: "Mentoring & Feedback",
        description: "Supports TLs in coaching and performance management, ensuring that verbal and written feedback is fair, delivered clearly and frequently alongside support-to-improve. Provides additional coaching through skip-levels Sets clear expectations, solicits, synthesizes and delivers feedback for growth. Demonstrates good judgement and ability when handling complex employee issues Conducts regular performance evaluations, offering constructive feedback for improvement."
    }
];

export async function seedDatabase(): Promise<void> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is seeding the database with initial engineering job matrix data.
    // Should create all engineering levels and their associated criteria from the sample data above.
    // In a real implementation, this would parse the full spreadsheet data and populate the database.
    console.log('Seeding database with initial job matrix data...');
}