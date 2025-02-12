import { expect, test, describe } from 'vitest'
import { execSync } from 'child_process'
import { version } from '../package.json'

describe('CLI', () => {
    test('version command outputs correct version', () => {
        const output = execSync('node ./bin/cli.js --version').toString()
        expect(output.trim()).toContain(version)
    })
})