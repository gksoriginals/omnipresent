import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openRouterKey} from '../server/models/decision-transport.js';
test("hosted comparisons require explicit credentials instead of discovering other app auth",async()=>{
 const previous=process.env.OPENROUTER_API_KEY;
 try{delete process.env.OPENROUTER_API_KEY;await assert.rejects(openRouterKey(),/configure OPENROUTER_API_KEY/);process.env.OPENROUTER_API_KEY='fixture-only-not-a-provider-token';assert.equal(await openRouterKey(),'fixture-only-not-a-provider-token');}
 finally{if(previous===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=previous;}
});
