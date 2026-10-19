/** Tested product choices. Experimental profiles never silently replace these. */
export const runtimeDefaults=Object.freeze({
 preparation:Object.freeze({baseURL:'http://127.0.0.1:11434/v1',model:'qwen3.5:4b'}),
 presentation:Object.freeze({profile:'local-hybrid',planner:'synthesis',preferenceBudgetMs:300}),
});
