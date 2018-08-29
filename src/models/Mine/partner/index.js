import React, { Component } from 'react'
// import { SearchBar } from 'antd-mobile'
import { Header, Content } from 'Components'
import NewIcon from 'Components/NewIcon'
import history from 'Util/history'
import * as urls from 'Contants/urls'
import style from './style.css'
import api from 'Util/api'
class Partner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      partnerList: [],
      isLoading: false
    }
  }
  componentWillMount() {
    this.getPartnerList()
  }
  getPartnerList = async() => {
    this.setState({
      isLoading: false
    })
    const data = await api.Mine.partnerMange.getPartnerList({ // 获取合作方 列表
    }) || false
    this.setState({
      partnerList: data.list,
      isLoading: true
    })
  }

  render() {
    const { partnerList, isLoading } = this.state
    return (
      <div className='pageBox'>
        <Header
          title='合作方'
          leftIcon='icon-back'
          leftTitle1='返回'
          leftClick1={() => {
            history.push(urls.MINE)
          }}
          rightTitle={<NewIcon type='icon-hzfadd' />}
          rightClick={() => {
            history.push(urls.ADDPARTNER)
          }}
        />
        <Content>
          <div className={style['partner-box']}>
            {/* <div className={style['partner-search']}>
              <SearchBar placeholder='搜索姓名/拼音/电话' maxLength={8} />
            </div> */}
            <ul className={style['partner-list']}>
              {
                partnerList.length && isLoading
                  ? partnerList.map((item, index) => {
                    return (<li key={index} className='my-bottom-border'>
                      <section>
                        <h4>{item.name}</h4>
                        <p>{ item.type === 1 ? '个人' : '企业' }</p>
                        <p>{item.mobile}<em>{ }</em></p>
                        <p>{item.address || ''}</p>
                      </section>
                      <footer>
                        <NewIcon type='icon-message_pre' />
                        <NewIcon type='icon-phone' />
                      </footer>
                    </li>)
                  }) : <div>{isLoading ? '无合作方' : ''}</div>
              }
            </ul>
          </div>
        </Content>
      </div>
    )
  }
}

export default Partner
