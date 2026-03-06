import { describe, expect, it } from 'vitest'
import { parseSpreadsheet } from '@/lib/importClients'

const createJsonFile = (content: string, name = 'clients.json') =>
  ({
    name,
    text: async () => content,
  } as unknown as File)

describe('parseSpreadsheet json support', () => {
  it('parses an array of objects', async () => {
    const file = createJsonFile(
      JSON.stringify([
        { firstName: 'Awa', lastName: 'Diop', phone: '+221771234567', cni: '1234567890123' },
      ])
    )

    const result = await parseSpreadsheet(file)

    expect(result.headers).toEqual(['firstName', 'lastName', 'phone', 'cni'])
    expect(result.rows).toEqual([['Awa', 'Diop', '+221771234567', '1234567890123']])
  })

  it('parses object payloads containing a data array', async () => {
    const file = createJsonFile(
      JSON.stringify({
        data: [
          { firstName: 'Moussa', lastName: 'Ba', phone: '771234567', cni: '1234567890123' },
        ],
      })
    )

    const result = await parseSpreadsheet(file)

    expect(result.headers).toEqual(['firstName', 'lastName', 'phone', 'cni'])
    expect(result.rows).toEqual([['Moussa', 'Ba', '771234567', '1234567890123']])
  })

  it('parses arrays with header row', async () => {
    const file = createJsonFile(
      JSON.stringify([
        ['firstName', 'lastName', 'phone', 'cni'],
        ['Fatou', 'Ndiaye', '761112233', '1234567890123'],
      ])
    )

    const result = await parseSpreadsheet(file)

    expect(result.headers).toEqual(['firstName', 'lastName', 'phone', 'cni'])
    expect(result.rows).toEqual([['Fatou', 'Ndiaye', '761112233', '1234567890123']])
  })

  it('throws a readable error for invalid json', async () => {
    const file = createJsonFile('{"firstName":"Awa"')

    await expect(parseSpreadsheet(file)).rejects.toThrow('JSON invalide')
  })
})
