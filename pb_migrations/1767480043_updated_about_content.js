/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1625307897")

  // remove field
  collection.fields.removeById("text4274335913")

  // add field
  collection.fields.addAt(2, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor4274335913",
    "maxSize": 0,
    "name": "content",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1625307897")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4274335913",
    "max": 0,
    "min": 0,
    "name": "content",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("editor4274335913")

  return app.save(collection)
})
