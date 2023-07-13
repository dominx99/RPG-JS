import { Presets, RpgModule, RpgPlayer, RpgServer } from '@rpgjs/server'
import { Armor, Weapon, State } from '@rpgjs/database'
import { HpUpValue } from './fixtures/armor'
import { _beforeEach } from './beforeEach'
import { clear } from '@rpgjs/testing'
import { beforeEach, test, afterEach, expect, describe, vitest } from 'vitest'

const { MAXHP_CURVE, MAXSP_CURVE, MAXHP, ATK, PDEF, SDEF, MAXSP } = Presets

let client, player, fixture, playerId, server

beforeEach(async () => {
   const ret = await _beforeEach()
   client = ret.client
   player = ret.player
   server = ret.server
   fixture = ret.fixture
   playerId = ret.playerId
})

test('Test HP', () => {
   expect(player.hp).toBe(MAXHP_CURVE.start)
})

test('Test SP', () => {
   expect(player.sp).toBe(MAXSP_CURVE.start)
})

test('Test MaxHP', () => {
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start)
})

test('Test MaxSP', () => {
   expect(player.param[MAXSP]).toBe(MAXSP_CURVE.start)
})

test('Test Atk', () => {

   @Weapon({
      name: 'Weapon',
      [ATK]: 100
   })
   class Weapon1 { }

   player.addItem(Weapon1)
   player.equip(Weapon1)

   expect(player[ATK]).toBe(100)
})

test('Test Pdef/Sdef', () => {

   @Armor({
      name: 'Armor1',
      [PDEF]: 100,
      [SDEF]: 150
   })
   class Armor1 { }

   @Armor({
      name: 'Armor2',
      [PDEF]: 100
   })
   class Armor2 { }

   player.addItem(Armor1)
   player.addItem(Armor2)
   player.equip(Armor1)
   player.equip(Armor2)

   expect(player[PDEF]).toBe(200)
   expect(player[SDEF]).toBe(150)
})

test('Test MaxHP Modifier Value', () => {
   player.addItem(HpUpValue)
   player.equip(HpUpValue)
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start + 100)
   player.equip(HpUpValue, false)
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start)
})

test('Test MaxHP Modifier Rate', () => {

   @Armor({
      name: 'HpUpRate',
      paramsModifier: {
         [MAXHP]: {
            rate: 1.5
         }
      }
   })
   class HpUpRate { }

   player.addItem(HpUpRate)
   player.equip(HpUpRate)
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start * 1.5)
   player.equip(HpUpRate, false)
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start)
})

test('Test MaxHP Multi Modifier Value', () => {

   @Armor({
      name: 'HpUpValue1',
      paramsModifier: {
         [MAXHP]: {
            value: 100
         }
      }
   })
   class HpUpValue1 { }

   @Armor({
      name: 'HpUpValue2',
      paramsModifier: {
         [MAXHP]: {
            value: 150
         }
      }
   })
   class HpUpValue2 { }

   player.addItem(HpUpValue1)
   player.addItem(HpUpValue2)
   player.equip(HpUpValue1)
   player.equip(HpUpValue2)
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start + 250)
})

test('Test MaxHP Multi Modifier Rate', () => {

   @Armor({
      name: 'HpUpValue1',
      paramsModifier: {
         [MAXHP]: {
            rate: 1.5
         }
      }
   })
   class HpUpRate1 { }

   @Armor({
      name: 'HpUpValue2',
      paramsModifier: {
         [MAXHP]: {
            rate: 0.5
         }
      }
   })
   class HpUpRate2 { }

   player.addItem(HpUpRate1)
   player.addItem(HpUpRate2)
   player.equip(HpUpRate1)
   player.equip(HpUpRate2)
   expect(player.param[MAXHP]).toBe(MAXHP_CURVE.start)
})

test('Test Atk Multi Modifier Rate', () => {

   @Weapon({
      name: 'Weapon',
      [ATK]: 100
   })
   class Weapon1 { }

   @State({
      name: 'State',
      paramsModifier: {
         [ATK]: {
            value: 100
         }
      }
   })
   class State1 { }

   player.addItem(Weapon1)
   player.equip(Weapon1)
   player.addState(State1)

   expect(player[ATK]).toBe(200)
})

describe('Test Level', () => {
   beforeEach(() => {
      player.initialLevel = 1
      player.finalLevel = 99
      player.expCurve = {
         basis: 30,
         extra: 20,
         accelerationA: 30,
         accelerationB: 30
      }
      server.addInDatabase('heal', {
         name: 'Heal'
      }, 'skill')
   })

   // Test for initial exp value
   test('should start with 0 experience', () => {
      expect(player.exp).toBe(0)
   })

   // Test for changing exp value
   test('should change exp value when set', () => {
      player.exp = 100
      expect(player.exp).toBe(100)
   })

   // Test for leveling up when exp reaches the threshold
   test('should level up when exp reaches threshold', () => {
      player.exp = 160
      expect(player.level).toBe(2)
   })

   // Test for experience needed for the next level
   test('should calculate the exp needed for next level correctly', () => {
      expect(player.expForNextlevel).toBeGreaterThan(player.exp)
   })

   // Test for exp reset when level changes
   test('should reset exp to zero when level changes', () => {
      player.level = 2
      expect(player.exp).toBe(0)
   })

   // Test for level initialization
   test('should initialize level at 1', () => {
      expect(player.level).toBe(1);
   });

   // Test for level increment
   test('should increment level when set to a higher value', () => {
      player.level = 5;
      expect(player.level).toBe(5);
   });

   // Test for maximum level value
   test('should not exceed final level', () => {
      player.finalLevel = 99;
      player.level = 100;
      expect(player.level).toBe(99);
   });

   // Test for learning skills when level increases
   test('should learn new skills when level increases', () => {
      const mockSkill = { level: 2, skill: 'heal' };
      player._class = { skillsToLearn: [mockSkill] };
      player.level = 2;
      expect(player.getSkill('heal')).toBeDefined()
   });
})

describe('Test Hooks', () => {
   beforeEach(() => {
      clear()
   })

   test('Test onLevelUp Hook', () => {
      return new Promise(async (resolve: any) => {
         @RpgModule<RpgServer>({
            player: {
               onLevelUp: (player: RpgPlayer, incLevel: number) => {
                  expect(player).toBeDefined()
                  expect(incLevel).toBe(1)
                  resolve()
               }
            }
         })
         class RpgServerModule { }

         const { player } = await _beforeEach([{
            server: RpgServerModule
         }])

         player.level = 2
      })
   })
})

afterEach(() => {
   clear()
})