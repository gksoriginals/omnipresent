import {test} from "node:test";
import assert from "node:assert/strict";
import {LibrarySearch,libraryScope,scopeEligible} from "../server/controllers/library-search.js";
import {largeLibrary} from "../scripts/large-library-fixture.js";
test("scope cues abstain on ambiguity, negation and corrections",()=>{const a=largeLibrary();assert.equal(a.length,432);assert.equal(libraryScope("not actual 2025 Harbor School",a),null);assert.equal(libraryScope("actual 2025 Harbor School versus Cedar Campus",a),null);assert.equal(libraryScope("actual Harbor School",a),null);const s=libraryScope("actual 2025 Harbor School storage",a)!;assert.equal(a.filter(x=>scopeEligible(s,x)).length,24);});
test("library index preserves semantic-only candidates and stable ties",async()=>{const a=largeLibrary().slice(0,3);const index=new LibrarySearch(a,{space:{model:"test",revision:"1",dimensions:2},encode:async t=>t.map(()=>[1,0])});assert.throws(()=>index.rank("x",[1,0]),/Unbuilt/);await index.build(new AbortController().signal);assert.equal(index.rank("unmatched",[1,0]).length,3);assert.equal(index.rank("unmatched",[1,0])[0].id,a[0].id);assert.equal(index.rank("x",[1,0],()=>false).length,0);});
