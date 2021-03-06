/**
 * @Author: baosheng
 * @Date: 2018-05-28 16:43:20
 * @Title: 我的设置
 */
import React, { Component } from 'react'
import { List } from 'antd-mobile'
import * as urls from 'Contants/urls'
import { Header, Content } from 'Components'
// import api from 'Util/api'
import style from './style.css'
import icon from 'Src/assets/icon.png'
const Item = List.Item

class AboutUs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      version: ''
    }
  }

  componentDidMount() {
    if ('cordova' in window) {
      cordova.getAppVersion.getVersionNumber().then(version => this.setState({
        version
      }))
    }
  }

  render() {
    let { version } = this.state
    return <div className='pageBox'>
      <Header
        title='关于我们'
        leftIcon='icon-back'
        leftTitle1='设置'
        leftClick1={() => {
          this.props.match.history.push(urls.SETUP)
        }}
      />
      <Content>
        <div className={style['about']}>
          <div className={`${style['about-avatar']} my-full-border`}>
            <img src={icon} />
          </div>
        </div>
        <p className={style['about-v']}>亚雀用工{
          'cordova' in window ? ' V' + version : ''
        }</p>
        <div className={style['about-content']}>
          <List>
            {/* <Item onClick={() => {}} arrow='horizontal'>去评分</Item> */}
            <Item onClick={() => this.props.match.history.push(urls.CLAUSE)}arrow='horizontal'>服务条款</Item>
          </List>
        </div>
      </Content>
    </div>
  }
}

export default AboutUs
