//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//---------------------------------------------------------
// connect mongo db
mongoose.connect("mongodb+srv://admineid:19791222@cluster0-hyt7n.mongodb.net/todolistDB?retryWrites=true&w=majority",{
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  promiseLibrary: global.Promise
});

//creating Schema
const itemsSchema = {
  name: String
};
//
// creating model with schema
const Item = mongoose.model("Item", itemsSchema);

//declaring datas
const item1 =  new Item ({
  name: "Add new items"
})

const item2 = new Item ({
  name: "<- click checkbox to delete"
})

const item3 = new Item ({
  name: "extra items"
})

// consolidate data into one const
const defaultItems = [item1,item2,item3];
// const defaultItems = [];
// custom list schema
const listSchema = {
  name : String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//inserting data to data mdoel.


//--------------------------------Homepage-----------------------------------
app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems,function(err){
        if(err) {
          console.log("failed to insert data");
        } else {
          console.log("Success Insertion Data");
        }
      });
      res.redirect("/")
    } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
   }

 });



 //----------------Dynamic Route---page-------
 app.get("/:customList",function(req,res){
   const customList = _.capitalize(req.params.customList);

   List.findOne({name: customList}, function(err, foundList){
     if(!err){
       if (!foundList){
         const list = new List({
           name: customList,
           items: defaultItems
         });
         list.save();
         res.redirect("/" + customList);

       } else {
         //Show an existing list.
         res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
       }
     }
   });
 });
});

//----------------new items
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName},function(err, foundList){
      foundList.items.push(item);
      foundList.save();

      res.redirect("/" + listName);
    });
  };


});
//----------------delete items
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //----- mongoose find and remove by ID .
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Deleted");

        res.redirect("/");
      }
    });
  } else {
        console.log(listName);
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
          if (!err) {
            console.log("Deleted Custom List Iemm");
            res.redirect("/" + listName);
          } else {
            console.log(err);
            console.log(listName);
          };
        });
      };
    });

app.get("/about", function(req, res){
  res.render("about");
});


//-----------------------------
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};

app.listen(port, function() {
  console.log("Server started on port" + port);
});
