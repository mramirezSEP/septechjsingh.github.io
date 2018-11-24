import React, { Component } from 'react';
import './App.css';
import axios from 'axios'

//mycomponents
import Login from './components/Login'
import Pools from './components/Pools'

class App extends Component {

  constructor(props){
    super(props);
    this.state={
      inspections:[],
      pools:[],
      checklists:[],
      itemIds:[],
      token:'',
      user:'',
      key:'',
      failed:false,
      loadPools:false
    }
    this.handleSubmit= this.handleSubmit.bind(this)
    this.getInitialInspectionsChecklists=this.getInitialInspectionsChecklists.bind(this)
    this.getWQSampleList=this.getWQSampleList.bind(this)
    this.getPoolItemsTable=this.getPoolItemsTable.bind(this)
    this.handlePoolSampleInfo=this.handlePoolSampleInfo.bind(this)
  }

   getInitialInspectionsChecklists(inspList, header){
     var myPools=[]
     var initialInsp = inspList.filter((insp)=>{
       return insp.status.value=="Scheduled" && insp.type.value=="Pool Test Results"
     })
    var inspPromise=initialInsp.map((insp)=>{
      return new Promise(function(resolve, reject){
                 axios.get(`https://apis.accela.com/v4/inspections/${insp.id}/checklists`,header)
               .then(data=>{
                 resolve(data.data.result)
               })
               .catch(error=>{
                 console.log(`error getting checklists for ${insp.id}`)
               })
             })
           })
    Promise.all(inspPromise).then((insp)=>{
      return insp.flat()
    }).then((checklists)=>{
      this.getWQSampleList(checklists, header);
    })
    .catch((error)=>{
      console.log("error resolving inspection promises")
      debugger
    })
  }

  getWQSampleList(lists, header){
    var wqList=lists.filter((list)=> list.group==="Pool Test Results")
    var itemsPromises=wqList.map((list)=>{
      this.setState({
        inspections:[... this.state.inspections, list.inspectionId],
        checklists:[...this.state.checklists, list.id]
      })
      return new Promise(function(resolve, reject){
                 axios.get(`https://apis.accela.com/v4/inspections/${list.inspectionId}/checklists/${list.id}/checklistItems`,header)
               .then(data=>{
                 resolve(data.data.result)
               })
               .catch(error=>{
                 console.log(`error getting checklist items for ${list.id}`)
               })
             })
           })
    Promise.all(itemsPromises).then((items)=>{
       this.getPoolItemsTable(items, header);
    })
  }

  getPoolItemsTable(items, header){
    var test=""
    var poolItems=items.map((set, index)=>{
        return set.filter((item)=> item.checklist=="Pool Test Results")
    })
    var tablePromises=poolItems.map(function(item, index){
      this.setState({
        itemIds:[...this.state.itemIds, item[0].id]
      })
      return new Promise(function(resolve, reject){
                 axios.get(`https://apis.accela.com/v4/inspections/${this.state.inspections[index]}/checklists/${item[0].checklistId}/checklistItems/${item[0].id}/customTables`, header)
               .then(function(data){
                 resolve(data.data.result)
               }.bind(this))
               .catch(error=>{
                 console.log(`error getting custom tables for ${item.id}`)
               })
             }.bind(this))
    }.bind(this))
    Promise.all(tablePromises).then((table)=>{
      return table.flat()
    }).then((tables)=>{
       return tables.filter((t)=>t.id=="POOL_LIC-OUTSIDE.cLAB.cPOOL.cSAMPLES")
    }).then((poolSamples)=>{
      this.handlePoolSampleInfo(poolSamples)
    })
  }

  handlePoolSampleInfo(poolSamples){
    var row;
    poolSamples.forEach((sample, index)=>{
      if(sample.rows){
         row= Object.assign({inspection:this.state.inspections[index], submit:false, rowId:sample.rows[0].id, checklistId:this.state.checklists[index], itemIds:this.state.itemIds[index]}, sample.rows[0].fields)
      }else{
        row={inspection:this.state.inspections[index],
          checklistId:this.state.checklists[index],
          itemId:this.state.itemIds[index],
          "submit":false,
          "rowId":"",
          "Coliform Results":"",
          "Collection Date":"",
          "Valid Results":"",
          "Sample ID":"",
          "E. Coli Results":"",
          "HPC":"",
          "Notes":"",
          "Name":"",
          "Updated":false
        }
      }
        this.setState({
          pools:[...this.state.pools, row]
        })
    })
    this.setState({
      loadPools:true
    })
  }



  handleSubmit(username, password){
    var header={
      "headers": {
      "authorization": "NdCld7jo5njgLdFJLX77VpXvPTVEPd9qoxMOiqJMe3o61FY9UpZTFHrz2jrhLDIxwo_DKuy70iHit_dFzov9NYHsRrVSGNBFdCf8xZolGY5ZQJMYD7sboJf8t8YxPJQjJHATeCSALGfgRsi1ep1zRcwHpojz1T43tXZECeWNC2sqB0QntomiR2I22WfSOKTCwmMfRPHwkZMQrbK5Xmv5nwjnrMtocD3uEc0rZhUxYXZB4pBlJ4uc1gmKl8B39Q8ZU8ifGfLbe0lRUTUN6dKprIVTs7STxwAkGx-AGcUPSrT4BHr76UvckecoMaiOwC8-XVyxemhELJC_a964yIZYyRLZo6DR7lBMK1BdoGoifMGKl458WEdciAy46eT62rrl_JoPB5SamwFaU0qQJZ2p1VttixJWxNe4p_05xmp3bK-m4xYWH7N2vzjMtjcmZilN27fctYuKmYna6e2NU0Vujg2",
      "cache-control": "no-cache",
      "postman-token": "59acabbe-f19d-c8a1-f10d-dd1b1918b660"
    }}
    this.setState({
      user:'lwacht@septechconsulting.com'
    })
    axios.get("https://apis.accela.com/v4/records/mine", header)
    .then(function(data){
      return data.data.result.filter((cap)=>{
        return cap.type.type=="WQ" && cap.type.category=="License" && (cap.status.value != "Closed – Permanent" || cap.status.value !="Closed – Self Closure")
      })
    }.bind(this))
    .then((waterQualityCaps)=>{
        return waterQualityCaps.map((wqCap)=>{
          return new Promise(function(resolve, reject){
                   axios.get( `https://apis.accela.com/v4/records/${wqCap.id}/inspections`, header)
                   .then(data=>{
                     resolve(data.data.result)
                   })
                   .catch(error=>{
                     console.log(`error getting inspections for ${wqCap.id}`)
                   })
                 })
               })
    }).then((promiseArr)=>{
      Promise.all(promiseArr).then((insp)=>{
        console.log("Got all water quality inspections")
        return insp.flat()
      }).then((wqInspections)=>{
        this.getInitialInspectionsChecklists(wqInspections, header);
      })
      .catch((error)=>{
        console.log("Error resolving inspection promises")
      })
    })
    .catch((error)=>{
      console.log("error getting my caps")
    })
  }







  render() {
    return (
      <div className="App">
      {this.state.loadPools ? <div> <div id="current_user">{this.state.user}</div>
          <Pools pools_list={this.state.pools}/> </div> : <Login handleSubmit={this.handleSubmit} failed={this.state.failed}/>}
      </div>
    );
  }
}

export default App;
