import type { Agent, Company } from '~/domain/models.js';
import { createId, nowIso, stableNumberFromString } from '~/application/services/utils.js';

const roleOrder: Agent['role'][] = ['pm', 'tl', 'be', 'fe', 'qa'];

const roleNames: Record<Agent['role'], { ru: string[]; en: string[] }> = {
  pm: { ru: ['Anna', 'Maria', 'Sofia'], en: ['Anna', 'Maria', 'Sophia'] },
  tl: { ru: ['Ilya', 'Maxim', 'Daniil'], en: ['Ilya', 'Max', 'Daniel'] },
  be: { ru: ['Dmitry', 'Pavel', 'Oleg'], en: ['Dmitry', 'Pavel', 'Oleg'] },
  fe: { ru: ['Elena', 'Ksenia', 'Natalia'], en: ['Elena', 'Ksenia', 'Natalia'] },
  qa: { ru: ['Igor', 'Roman', 'Artem'], en: ['Igor', 'Roman', 'Artem'] },
};

const roleResponsibilities: Record<Agent['role'], { ru: string[]; en: string[] }> = {
  pm: {
    ru: ['Define goals', 'Prioritize backlog', 'Keep founder visibility clear'],
    en: ['Define goals', 'Prioritize backlog', 'Keep founder visibility clear'],
  },
  tl: {
    ru: ['Decompose tasks', 'Validate architecture', 'Unblock team delivery'],
    en: ['Decompose tasks', 'Validate architecture', 'Unblock team delivery'],
  },
  be: {
    ru: ['Implement APIs', 'Maintain integrations', 'Ensure data integrity'],
    en: ['Implement APIs', 'Maintain integrations', 'Ensure data integrity'],
  },
  fe: {
    ru: ['Build UI', 'Maintain UX consistency', 'Integrate frontend with APIs'],
    en: ['Build UI', 'Maintain UX consistency', 'Integrate frontend with APIs'],
  },
  qa: {
    ru: ['Maintain test matrix', 'Validate acceptance criteria', 'Publish quality reports'],
    en: ['Maintain test matrix', 'Validate acceptance criteria', 'Publish quality reports'],
  },
};

const specializationHints: Record<Agent['role'], string> = {
  pm: 'roadmap, scope, acceptance criteria',
  tl: 'architecture, decomposition, technical risk',
  be: 'api, integrations, data modeling',
  fe: 'dashboard, forms, realtime UX',
  qa: 'regression, e2e, release quality',
};

export interface BlueprintResult {
  agents: Agent[];
  blueprint: {
    departments: string[];
    reportingLines: Array<{ managerRole: Agent['role']; reportRole: Agent['role'] }>;
    workflows: string[];
  };
}

export class CompanyGenerator {
  public generate(company: Company): BlueprintResult {
    const seed = stableNumberFromString(`${company.name}:${company.prompt}`);
    const isRu = company.language === 'ru';
    const now = nowIso();

    const agents: Agent[] = roleOrder.map((role, index) => {
      const names = isRu ? roleNames[role].ru : roleNames[role].en;
      const pickedName = names[(seed + index) % names.length];
      const responsibilities = isRu ? roleResponsibilities[role].ru : roleResponsibilities[role].en;

      const agent: Agent = {
        id: createId(),
        companyId: company.id,
        role,
        name: pickedName,
        managerAgentId: null,
        status: 'idle',
        modelProfile: 'balanced-v1',
        runtimeKind: 'mock_runtime',
        delegationLimit: role === 'tl' ? 3 : 1,
        specializationHint: specializationHints[role],
        responsibilities,
        toolPolicy: {
          canWriteTasks: role === 'pm' || role === 'tl',
          canReview: role === 'tl' || role === 'qa',
          canRequestApproval: true,
        },
        createdAt: now,
      };

      return agent;
    });

    const pm = agents.find((agent) => agent.role === 'pm');
    const tl = agents.find((agent) => agent.role === 'tl');
    const be = agents.find((agent) => agent.role === 'be');
    const fe = agents.find((agent) => agent.role === 'fe');
    const qa = agents.find((agent) => agent.role === 'qa');

    if (!pm || !tl || !be || !fe || !qa) {
      throw new Error('software_template_generation_failed');
    }

    pm.managerAgentId = null;
    tl.managerAgentId = pm.id;
    be.managerAgentId = tl.id;
    fe.managerAgentId = tl.id;
    qa.managerAgentId = tl.id;

    return {
      agents,
      blueprint: {
        departments: ['product', 'engineering', 'quality'],
        reportingLines: [
          { managerRole: 'pm', reportRole: 'tl' },
          { managerRole: 'tl', reportRole: 'be' },
          { managerRole: 'tl', reportRole: 'fe' },
          { managerRole: 'tl', reportRole: 'qa' },
        ],
        workflows: [
          'intake -> planning -> execution -> review -> approval -> done',
          'handoff payload contract required between agents',
        ],
      },
    };
  }
}