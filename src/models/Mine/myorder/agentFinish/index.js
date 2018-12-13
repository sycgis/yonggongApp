import React, { Component } from 'react'
import { Header, Content } from 'Components'
import { List, Checkbox, Modal, InputItem } from 'antd-mobile'
import api from 'Util/api'
import * as tooler from 'Contants/tooler'
import style from './style.css'
const CheckboxItem = Checkbox.CheckboxItem
const AgreeItem = Checkbox.AgreeItem
const alert = Modal.alert
class ApplySettle extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orderno: tooler.getQueryString('orderno'),
      valuationWay: tooler.getQueryString('valuationWay'),
      checkall: false,
      dataSource: [],
      isloading: false
    }
  }
  componentDidMount() {
    this.getDatalist()
  }
  getDatalist = async () => {
    this.setState({
      isloading: false
    })
    let { orderno } = this.state
    let data = await api.Mine.myorder.agentFinishList({
      page: 1,
      limit: 500,
      order_no: orderno
    }) || false
    if (data) {
      let dataSource = []
      for (let j = 0; j < data['list'].length; j++) {
        dataSource.push({
          ...data['list'][j],
          ...{ ischeck: false }
        })
      }
      let checkall = false
      for (let i = 0; i < dataSource.length; i++) {
        if (dataSource[i].ischeck) {
          checkall = true
        } else {
          checkall = false
          break
        }
      }
      this.setState({
        dataSource,
        checkall,
        isloading: true
      })
    }
  }
  onChange = (val) => {
    let { dataSource } = this.state
    let index = dataSource.indexOf(val)
    dataSource[index]['ischeck'] = !dataSource[index]['ischeck']
    let checkall = false
    for (let i = 0; i < dataSource.length; i++) {
      if (dataSource[i].ischeck) {
        checkall = true
      } else {
        checkall = false
        break
      }
    }
    console.log('checkall', checkall)
    this.setState({
      dataSource,
      checkall
    })
  }
  handleCheckAll = () => { // 全部选择
    let { dataSource, checkall } = this.state
    let newdata = []
    if (checkall) {
      dataSource.map((item) => {
        newdata.push({ ...item, ...{ ischeck: false }})
      })
    } else {
      dataSource.map((item) => {
        newdata.push({ ...item, ...{ ischeck: true }})
      })
    }
    console.log(newdata)
    this.setState({
      dataSource: newdata,
      checkall: !checkall
    })
  }
  countTotal = (data) => { // 计算总数
    let total = 0
    data.map((item) => {
      item.ischeck ? total += 1 : null
    })
    console.log(total)
    return total !== 0 ? total : 0
  }
  handleApply = () => { // 代完工事件
    let { dataSource } = this.state
    let ishas = false
    for (let i = 0; i < dataSource.length; i++) {
      if (dataSource[i].ischeck) {
        ishas = true
        break
      } else {
        ishas = false
      }
    }
    if (!ishas) {
      alert('请选择代完工的人员')
    } else {
      let uids = []
      dataSource.map((item) => {
        if (item.ischeck) {
          uids.push(item['uid'])
        }
      })
      console.log(uids)
      this.agentFinishWork(uids)
    }
  }
  agentFinishWork = async (uids) => { // 代开工操作
    let { orderno } = this.state
    let data = await api.Mine.myorder.agentFinishWork({
      order_no: orderno,
      task_list: uids
    }) || false
    if (data) {
      this.props.match.history.go(-1)
    }
  }
  render() {
    let { dataSource, checkall, isloading, valuationWay } = this.state
    return <div className='pageBox gray'>
      <Header
        title='代完工列表'
        leftIcon='icon-back'
        leftTitle1='返回'
        leftClick1={() => {
          this.props.match.history.go(-1)
        }}
      />
      <Content>
        {
          isloading && dataSource.length !== 0 ? <div>
            <List className={style['settle-list']}>
              {dataSource.map(i => (
                <CheckboxItem key={i.uid} checked={i.ischeck} activeStyle={{ backgroundColor: '#fff' }} onChange={() => this.onChange(i)}>
                  <img className={style['header']} src={i['tasker_avatar']} />
                  <div className={style['settle-info']}>
                    <h2>{i.tasker_name}</h2>
                    <p>手机号：{i['tasker_mobile']}</p>
                    <time>开工时间：{i['started_at']}</time>
                  </div>
                  {
                    valuationWay === '1' ? <span className={style['price']}>
                      <InputItem
                        placeholder=''
                        extra={`${i.workload_unit}`}
                        defaultValue={0}
                        onChange={(value) => this.handlePrice(i.uid, value)}
                        onBlur={(value) => this.handleBlurprice(i.uid, value)}
                      />
                    </span> : null
                  }
                </CheckboxItem>
              ))}
            </List>
            <div className={style['btn-box']}>
              <AgreeItem checked={checkall} onChange={this.handleCheckAll}>全选</AgreeItem>
              <a onClick={this.handleApply}>代完工</a>
              <span>共选择：<em>{this.countTotal(dataSource)}人</em></span>
            </div>
          </div> : dataSource.length === 0 && isloading ? <div className='nodata'>暂无数据</div> : null
        }
      </Content>
    </div>
  }
}

export default ApplySettle