import React, {Component} from 'react'
import axios from 'axios'

export default class Login extends Component{
  constructor(props){
    super(props)
    this.state={
      username:'',
      password:'',
      failed:false
    }
    this.handleInput=this.handleInput.bind(this)
    this.requestSubmit=this.requestSubmit.bind(this)
  }

  handleInput(e){
    this.setState(
      {
        [e.target.name] : e.target.value
      }
    )
  }

  requestSubmit(e){
    e.preventDefault()
    this.props.handleSubmit(this.state.username, this.state.password)
  }

  render(){
    return(
      <div>
      {this.props.user ? <div>{this.props.user}</div> :
      <form onSubmit={this.requestSubmit}>
        <label>Username</label>
        <input type='text' name='username' value={this.state.username} onChange={this.handleInput}/>
        <label>Password</label>
        <input type='password' name='password' value={this.state.password} onChange={this.handleInput}/>
        <input type='submit' value='Login' className='button'/>
      </form>
    }
      </div>
    )
  }
}
