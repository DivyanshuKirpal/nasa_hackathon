import {
  environmentsFileSchema,
  indicatorsFileSchema,
  protocolsFileSchema,
  regionsFileSchema,
  rulesFileSchema,
  sourcesFileSchema,
} from '../engine/schemas.ts'
import { findDataProblems, type HealthData } from '../engine/validateData.ts'
import environmentsJson from './environments.json'
import indicatorsJson from './indicators.json'
import protocolsJson from './protocols.json'
import regionsJson from './regions.json'
import rulesJson from './rules.json'
import sourcesJson from './sources.json'

// Every data file is validated when the app loads (CLAUDE.md code rules):
// a schema error or a broken cross-reference stops the app with a clear
// message instead of producing wrong alerts.
const environmentsFile = environmentsFileSchema.parse(environmentsJson)

/** Link defaults; the ground handling time is a prototype assumption (section 13.2). */
export const linkDefaults = {
  groundHandlingMin: environmentsFile.groundHandlingMin,
  groundHandlingNote: environmentsFile.groundHandlingNote,
}

export const healthData: HealthData = {
  indicators: indicatorsFileSchema.parse(indicatorsJson).indicators,
  regions: regionsFileSchema.parse(regionsJson).regions,
  sources: sourcesFileSchema.parse(sourcesJson).sources,
  environments: environmentsFile.environments,
  rules: rulesFileSchema.parse(rulesJson).rules,
  protocols: protocolsFileSchema.parse(protocolsJson).protocols,
}

const problems = findDataProblems(healthData)
if (problems.length > 0) {
  throw new Error(`Health data files are inconsistent:\n${problems.join('\n')}`)
}
