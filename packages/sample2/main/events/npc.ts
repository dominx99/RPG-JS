import { RpgEvent, EventData, RpgPlayer, ShapePositioning, RpgShape, Speed, Move, Components } from '@rpgjs/server'

@EventData({
    name: 'EV-1'
})
export default class CatEvent extends RpgEvent {
    onInit() {
        this.setGraphic('male')
        this.setHitbox(16, 16)
        //this.infiniteMoveRoute([ Move.tileRandom() ])
        this.setComponentsTop(
            Components.text('{id}')
        )
        this.speed = Speed.Slow
        this.attachShape({
            height: 100,
            width: 100,
            positioning: ShapePositioning.Center
        })
    }

    onDetect(player, shape) {
        this.moveTo(player).subscribe()
    }
}