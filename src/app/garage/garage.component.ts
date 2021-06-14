import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-garage',
  templateUrl: './garage.component.html',
  styleUrls: ['./garage.component.css']
})
export class GarageComponent implements OnInit {
  garage: AngularFirestoreDocument<any> = null;
  user: AngularFirestoreDocument<any> = null;
  items: Observable<any[]>;
  users: Observable<any[]>;
  vehicles = {};
  servicedata= {};
  jobcardata = {};
  jobs = "";
  customerId;
  outDate = new Date();
  // console.log(user);

  constructor(public db: AngularFirestore) {
    this.garage = db.collection('/garages').doc("7378956754");
    this.garage.valueChanges().subscribe(res => {
      console.log("garage", res)
      this.items = res;
      console.log(this.items["serviceRequests"])
      for (let id in this.items["serviceRequests"]) {
        db.collection('/users').doc(id).ref.get().then((doc) => {
          if (doc.exists) {
            console.log("Document data:", doc.data());
            console.log("type", typeof doc.data());
            console.log("vehicle data is ",doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"]])
            // console.log(doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"];])
            this.vehicles[id] = doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"]];
          } else {
            console.log("No such document!");
          }
        });
      }
      console.log("vehicle data is", this.vehicles)
    });

  }
  ngOnInit() {
  }
  
  viewJob = (user,vehicle)=>{
    console.log(vehicle);
    this.customerId = user;
    this.db.collection('/users').doc(user).ref.get().then((doc) => {
      if (doc.exists) {
        this.servicedata = doc.data()["requestedServices"][vehicle];
        console.log(this.servicedata)
        // console.log(doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"];])
        // this.vehicles[id] = doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"]];
      } else {
        console.log("No such document!");
      }
    });
  }

  rejectJob = (user,id="7378956754")=>{
    this.db.collection('/garages').doc(id).ref.get().then((doc) => {
      if (doc.exists) {
        let  services = doc.data()["serviceRequests"];
        var date = new Date()
        var key = date.getFullYear()+":"+date.getMonth()+":"+(date.getDate()+1)+":"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+":"+user
        console.log(key)
        let rejects = doc.data()["rejectedRequests"];
        rejects[key] = services[user]
        delete services[user]
        this.db.collection('/garages').doc(id).update({rejectedRequests:rejects})
        console.log("rejected")
        this.db.collection('/garages').doc(id).update({serviceRequests:services})
        console.log("service requests updated")
        // console.log(doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"];])
        // this.vehicles[id] = doc.data().vehicles[this.items["serviceRequests"][id]["vehicle"]];
      } else {
        console.log("No such document!");
      }
    });
  }

  acceptJob = (user,vehicle)=>{
    var garages;
    var garageid = "7378956754"
    this.outDate = new Date(this.outDate);
    var outDate = this.outDate.getFullYear()+":"+(this.outDate.getMonth()+1)+":"+this.outDate.getDate()+":"+this.outDate.getHours()+":"+this.outDate.getMinutes()+":"+this.outDate.getSeconds()
    this.outDate = new Date()
    console.log("namaewa ",this.items['serviceRequests'][user])
    var inDate = this.outDate.getFullYear()+":"+(this.outDate.getMonth()+1)+":"+this.outDate.getDate()+":"+this.outDate.getHours()+":"+this.outDate.getMinutes()+":"+this.outDate.getSeconds()
    // console.log(inDate,outDate)
    // console.log("outdate",new Date(this.outDate))
    
    var data = {
      cc: this.vehicles[user]["engine"],
      deliveryDone:false,
      garage: garageid,
      serviceClosed:false,
      vehicleCompany:this.vehicles[user]["company"],
      vehicleNumber:vehicle,
      vehicleOwner: this.items['serviceRequests'][user]['name'],
      vehicleType: this.vehicles[user]["type"],
      inDate:inDate,
      outDate:outDate,
      jobs:this.jobcardata
    }

    
    console.log("before empty doc ")
    var id = inDate+":"+user
    console.log("after empty doc ")
    this.db.collection('/services').doc(id).set(data)
    this.db.collection('/users').doc(user).ref.get().then((doc)=>{
      garages = doc.data().requestedServices[vehicle]['garageList'];
      // console.log(garages[0]);
      Object.keys(garages).forEach(element => {
        if(element != garageid)
        {
          this.rejectJob(user,element)
        }
      });
    })
    this.db.collection('/garages').doc(garageid).ref.get().then((doc) => {
      if (doc.exists) {
        let  services = doc.data()["serviceRequests"];
        let  accepts = doc.data()["acceptedRequests"];
        accepts[id] = services[user]
        console.log(accepts)
        accepts[id]['serviceId'] = id
        
        delete services[user]
        this.db.collection('/garages').doc(garageid).update({acceptedRequests:accepts})
        this.db.collection('/garages').doc(garageid).update({serviceRequests:services})
        console.log("loggong user",user)
        this.db.collection('/users').doc(user).ref.get().then((doc) => {
          if(doc.exists){
            let requestedServices = doc.data()["requestedServices"]
            requestedServices[vehicle]['ServiceId'] = id
            requestedServices[vehicle]['status'] = "ongoing"
            requestedServices[vehicle]['garageList'][garageid] = true
            this.db.collection('/users').doc(user).update({requestedServices:requestedServices})
          }
          else{
            console.log("vehicle not requested for service")
          }
        })
      }
      else{
        console.log("Document not found")
      }
    })
  }

  addJob = ()=>{
    if (this.jobs)
    this.jobcardata[this.jobs] = false
    this.jobs=null
  }
  removeJob = (j)=>{
    delete this.jobcardata[j]
  }

}
