import randomstring from 'randomstring';
import config from '../config';
import DavAccount from '../models/davAccount/model';
import Update from '../models/update/model';
import Badge from '../models/badge/model';
import Person from '../models/person/model';
import Station from '../models/station/model';


export const randomDavAddress = () => {
  console.log("Random DAV address generated");
  return '0x'+randomstring.generate({
    length: 40,
    charset: 'hex'
  });
};

export const getDavIdIconUrl = davId => {
  if (!davId){
    throw new Error('No valid davId provided');
  }
  return `https://lorempixel.com/100/100/abstract/?${davId}`;
};

export const createThing = async (obj, type, isAdmin=false) => {

  let account = await DavAccount.create({});

  let thingDetails = Object.assign({},obj);

  thingDetails.account = {uid: account.uid, id:account._id};

  switch(type){
  case config.accountType.person:{
    let avatarUrl = isAdmin ? "https://i.imgur.com/8wMLFxe.jpg" : "https://i.imgur.com/rSIB5Z2.png";
    thingDetails.avatar = avatarUrl;
    return Person.create(thingDetails);
  }

  case config.accountType.station:{
    return Station.create(thingDetails);
  }

  case config.accountType.vehicle:{
    return console.log("create a vehicle");
  }

  default:{
    return console.log("not a valid type");
  }
  }
};

export const createBadge = async (obj) => {
  let badge = await Badge.findOne({title: obj.title}).exec();
  if(badge){
    console.log("Badge already exists");
    return;
  }
  console.log("creating new badge");
  let badgeDetails = Object.assign({}, obj);
  return Badge.create(badgeDetails);
};

export const awardBadge = async (person, badgeSlug) => {

  let badge = await Badge.findOne({slug:badgeSlug}).exec();

  await createUpdate(person,{
    description: `${person.name} has unlocked the <span class='update-bold'>${badge.title}</span> badge.`
  });

  return Person.findByIdAndUpdate(person._id, {$push:{badges:{badge:badge._id, awardedOn: new Date()}}}, {new:true}).exec();

};

export const createUpdate = async (person, update) => {

  let account = await DavAccount.findById(person.account.id).exec();
  let updateDetails = Object.assign({},update);
  updateDetails.davAccount = account._id;
  updateDetails.name = person.name;
  updateDetails.avatar = person.avatar;
  console.log(`${update.description}`);
  return Update.create(updateDetails);
};

export const followPerson = async (person, followeeUid, createUpdate) => {

  let followeePerson = await Person.findOne({'account.uid':followeeUid}).exec();

  if(createUpdate){
    await createUpdate(person,{
      description: `${person.name} started following ${followeePerson.name}.`
    });
  }

  return Person.findByIdAndUpdate(person._id, {$push:{following:followeePerson.account.id}}, {fields: {password:0}, new:true}).exec();

};
