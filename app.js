//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect (and create if necessary) to the database (27017 is the default port for mongod and mongos instances)
// for Node.js versions 18 and up, should use 127.0.0.1 instead of localhost
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your ToDo list!"
});

const item2 = new Item({
  name: "Hit the + button to add a  new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

async function getItems(){
  return await Item.find({});
}

app.get("/", function(req, res) {

  getItems().then(function(foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(function () {
          console.log("Successfully saved default items to DB.");
        }).catch(function (err) {
          console.log(err);
        });
      res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

 });

});

const findListByName = async function(listName) {
  return await List.findOne({ name: listName })
}

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

if (listName === "Today") {
  item.save();
  res.redirect("/");
} else {
  findListByName(listName).then(function(foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect(`/${listName}`);
  });
}
});

const deleteOneByID = async function(checkedItemId) {
  await Item.findByIdAndDelete(checkedItemId);
}

const findListByNameAndUpdateItemByID = async function(listName, checkedItemId) {
  await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
}

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    deleteOneByID(checkedItemId);
    res.redirect("/");
  } else {
    findListByNameAndUpdateItemByID(listName, checkedItemId).then(function(err, foundList){
      if(!err){
        res.redirect(`/${listName}`);
      }
    });
  }
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  findListByName(customListName).then(function(foundList){
    if (foundList !== null){
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();

      res.redirect(`/${customListName}`);
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
