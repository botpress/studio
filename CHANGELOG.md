## [0.0.41](https://github.com/botpress/studio/compare/v0.0.28...v0.0.41) (2021-10-22)


### Bug Fixes

* **qna:** fix context search in QnA ([#141](https://github.com/botpress/studio/issues/141)) ([f8bacf3](https://github.com/botpress/studio/commit/f8bacf355d122e6a6e7edc60c951468f71f96fea))
* **studio:** ignore proxy when calling core ([#142](https://github.com/botpress/studio/issues/142)) ([cf44e91](https://github.com/botpress/studio/commit/cf44e913b23005da2f25b391b1b73d407d9d16c5))



# [0.0.40](https://github.com/botpress/studio/compare/v0.0.39...v0.0.40) (2021-10-18)


### Bug Fixes

* always display search bar on qna ([#136](https://github.com/botpress/studio/issues/136)) ([0220da2](https://github.com/botpress/studio/commit/0220da24965daa3b1e35a4599e7d14e82229a4dc))



## [0.0.39](https://github.com/botpress/studio/compare/v0.0.28...v0.0.39) (2021-10-07)


### Bug Fixes

* **cms:** display unregistered content-types instead of error message ([#81](https://github.com/botpress/studio/issues/81)) ([d3370be](https://github.com/botpress/studio/commit/d3370be41630760ef5abd2625e6c227c70cff629))
* **core:** fix redis pubsub by adding redis scopes ([#83](https://github.com/botpress/studio/issues/83)) ([2ed671f](https://github.com/botpress/studio/commit/2ed671fef6c6f0f6cca6c58a7df193ce9985286f))
* **debugger:** use message ids ([#30](https://github.com/botpress/studio/issues/30)) ([2fc6756](https://github.com/botpress/studio/commit/2fc67569d72188a6776805d0e9e1bc21066fb958))
* **dev:** fix condition ([235389d](https://github.com/botpress/studio/commit/235389d3566b2df29c0244b954c9682dd372c1f5))
* **flow:** fix clearing node action parameters on close ([#91](https://github.com/botpress/studio/issues/91)) ([5ffbb9a](https://github.com/botpress/studio/commit/5ffbb9a191a6e1b2e0d702c8729b1746606e1b98))
* **flow:** fix ctrl + s toast text display ([#127](https://github.com/botpress/studio/issues/127)) ([e46f9a9](https://github.com/botpress/studio/commit/e46f9a9185a3f1508149d52249912071e0f3f001))
* **flow:** fix editing content elements using action modal ([#109](https://github.com/botpress/studio/issues/109)) ([c021286](https://github.com/botpress/studio/commit/c021286a5453c14abe3bc007a432099291afce91))
* **flowbuilder:** fix wait on issue with new rtl procedure ([#98](https://github.com/botpress/studio/issues/98)) ([b0f2db4](https://github.com/botpress/studio/commit/b0f2db48bbb533b8beaa14fbe0cb09b9ecaee0f0))
* **libraries:** fix inexistent folder ([74f8c01](https://github.com/botpress/studio/commit/74f8c016b83e71e2e59e78f37aaf46da8a856d91))
* **libraries:** more fix for distributed usage ([c22d9de](https://github.com/botpress/studio/commit/c22d9de9ebe9819e434abec837e1b53b244ad97a))
* **libraries:** updated logic to use disk first ([#63](https://github.com/botpress/studio/issues/63)) ([84ec937](https://github.com/botpress/studio/commit/84ec9378f0a60f5f2e2f9b6822facf16d42446a5))
* **qna:** fix language dropdown overlay issue  ([#115](https://github.com/botpress/studio/issues/115)) ([056686b](https://github.com/botpress/studio/commit/056686b8e71d94723108eb4136fda2e0e335679a))
* **studio:** add developer cue ([#94](https://github.com/botpress/studio/issues/94)) ([18e8fc2](https://github.com/botpress/studio/commit/18e8fc2a67aabe64418d9fc3dfc1f317e8395539))
* **studio:** added form validation to bot seetings page ([#129](https://github.com/botpress/studio/issues/129)) ([f557516](https://github.com/botpress/studio/commit/f557516df9d0795c116c66496ddb365390bd93f5))
* **studio:** allow changing conent-type when editing node content-element ([#121](https://github.com/botpress/studio/issues/121)) ([4bf2ae2](https://github.com/botpress/studio/commit/4bf2ae21b7a7aa69520aceade8e9c71189b1c564))
* **studio:** bot mig same behavior as core ([#86](https://github.com/botpress/studio/issues/86)) ([6fd2bdc](https://github.com/botpress/studio/commit/6fd2bdcfdcab7468d68be7297e393559df4abcba))
* **studio:** error when state missing in debugger ([#111](https://github.com/botpress/studio/issues/111)) ([31af69f](https://github.com/botpress/studio/commit/31af69fe18b7f2c0e34ca5fd18aaee8a7fcc6f74))
* **studio:** fix delete nodes link issue ([#62](https://github.com/botpress/studio/issues/62)) ([52ff16e](https://github.com/botpress/studio/commit/52ff16e970504106ee085e07285baf4abd9b401f))
* **studio:** fix permissions for libraries ([#119](https://github.com/botpress/studio/issues/119)) ([86e53ad](https://github.com/botpress/studio/commit/86e53adcff929b6b68ec9089af6b69e61462790b))
* **studio:** fix session storage with storage utils ([#22](https://github.com/botpress/studio/issues/22)) ([b292015](https://github.com/botpress/studio/commit/b2920157aacc9ef2ac1d386fb7c67656e0c3e78a))
* **studio:** fix typings for yn signature ([42c11e0](https://github.com/botpress/studio/commit/42c11e0c988e817384a8dda9f0a95a55b035b34a))
* **studio:** move events-related routes ([#56](https://github.com/botpress/studio/issues/56)) ([ccf010f](https://github.com/botpress/studio/commit/ccf010f2b81e2e6aca8ee5b876e84d5f1bde0e2a))
* **studio:** overlapping between search bar & node props side panel ([#37](https://github.com/botpress/studio/issues/37)) ([6e4d841](https://github.com/botpress/studio/commit/6e4d841cd83a0ecfb52d1d77d042a7c588b0fcfe))
* **studio:** prevent creating empty actions ([#118](https://github.com/botpress/studio/issues/118)) ([fed7ac6](https://github.com/botpress/studio/commit/fed7ac66da61b6ac3a5cc0d43ca1106806934e7c))
* **studio:** retry set studio ready call ([#105](https://github.com/botpress/studio/issues/105)) ([8ff62bb](https://github.com/botpress/studio/commit/8ff62bbf21f891cca959d48be2cc3e5c8830f2d7))
* **studio:** Ui changes ([#40](https://github.com/botpress/studio/issues/40)) ([a36be1b](https://github.com/botpress/studio/commit/a36be1b8fa02b6e324e957e1a9a3dd888d28641d))
* **studio-ui:** remove id from bot form parameters ([#90](https://github.com/botpress/studio/issues/90)) ([cffe305](https://github.com/botpress/studio/commit/cffe30525e83b4342344541268ae52fc207b2fcd))
* **ui:** modify channel-vonage content-type warn ([#134](https://github.com/botpress/studio/issues/134)) ([451d556](https://github.com/botpress/studio/commit/451d556b9ee54dca5c0fd9b823e47ee5f4f33f32))
* **ui-shared:** Fix collapsible toggleExpand undef ([#128](https://github.com/botpress/studio/issues/128)) ([9f3148e](https://github.com/botpress/studio/commit/9f3148eaf7e26c113c811986ea9bebf4db97afbb))
* edit translated caroussel data ([#122](https://github.com/botpress/studio/issues/122)) ([feaaafd](https://github.com/botpress/studio/commit/feaaafdcecefcd58810715920772e5f93d1b6f98))


### Features

* **qna:** add RTL content language support ([#132](https://github.com/botpress/studio/issues/132)) ([c8e5d9c](https://github.com/botpress/studio/commit/c8e5d9c0640cf17b7cd82f446903fd40ca029b33))
* Added Chinese language translation ([#135](https://github.com/botpress/studio/issues/135)) ([18221bb](https://github.com/botpress/studio/commit/18221bbf2e72db3fa4607523e70beed1da905e14))
* **dev:** binary branches ([#93](https://github.com/botpress/studio/issues/93)) ([51dd7ce](https://github.com/botpress/studio/commit/51dd7ce679456824f6b909a9d97525133dea49b5))
* improve content rtl support for nodes on botpress studio ([#61](https://github.com/botpress/studio/issues/61)) ([ae36c88](https://github.com/botpress/studio/commit/ae36c88af4fbddc3238529cf4824154714fca933))
* **config:** Add bot id as readonly on bot config ([#64](https://github.com/botpress/studio/issues/64)) ([49cffc5](https://github.com/botpress/studio/commit/49cffc5836cdf0ef065f49ec0d4cb506a84466e4))



## [0.0.38](https://github.com/botpress/studio/compare/v0.0.37...v0.0.38) (2021-09-28)

### Bug Fixes

- edit translated caroussel data ([#122](https://github.com/botpress/studio/issues/122)) ([feaaafd](https://github.com/botpress/studio/commit/feaaafdcecefcd58810715920772e5f93d1b6f98))
- **flow:** fix editing content elements using action modal ([#109](https://github.com/botpress/studio/issues/109)) ([c021286](https://github.com/botpress/studio/commit/c021286a5453c14abe3bc007a432099291afce91))
- **qna:** fix language dropdown overlay issue ([#115](https://github.com/botpress/studio/issues/115)) ([056686b](https://github.com/botpress/studio/commit/056686b8e71d94723108eb4136fda2e0e335679a))
- **studio:** allow changing conent-type when editing node content-element ([#121](https://github.com/botpress/studio/issues/121)) ([4bf2ae2](https://github.com/botpress/studio/commit/4bf2ae21b7a7aa69520aceade8e9c71189b1c564))
- **studio:** error when state missing in debugger ([#111](https://github.com/botpress/studio/issues/111)) ([31af69f](https://github.com/botpress/studio/commit/31af69fe18b7f2c0e34ca5fd18aaee8a7fcc6f74))
- **studio:** fix permissions for libraries ([#119](https://github.com/botpress/studio/issues/119)) ([86e53ad](https://github.com/botpress/studio/commit/86e53adcff929b6b68ec9089af6b69e61462790b))
- **studio:** prevent creating empty actions ([#118](https://github.com/botpress/studio/issues/118)) ([fed7ac6](https://github.com/botpress/studio/commit/fed7ac66da61b6ac3a5cc0d43ca1106806934e7c))

## [0.0.37](https://github.com/botpress/studio/compare/v0.0.36...v0.0.37) (2021-09-16)

### Bug Fixes

- **studio:** fix session storage with storage utils ([#22](https://github.com/botpress/studio/issues/22)) ([b292015](https://github.com/botpress/studio/commit/b2920157aacc9ef2ac1d386fb7c67656e0c3e78a))
- **studio:** retry set studio ready call ([#105](https://github.com/botpress/studio/issues/105)) ([8ff62bb](https://github.com/botpress/studio/commit/8ff62bbf21f891cca959d48be2cc3e5c8830f2d7))

## [0.0.36](https://github.com/botpress/studio/compare/v0.0.35...v0.0.36) (2021-09-13)

### Bug Fixes

- **flowbuilder:** fix wait on issue with new rtl procedure ([#98](https://github.com/botpress/studio/issues/98)) ([b0f2db4](https://github.com/botpress/studio/commit/b0f2db48bbb533b8beaa14fbe0cb09b9ecaee0f0))

## [0.0.35](https://github.com/botpress/studio/compare/v0.0.34...v0.0.35) (2021-09-10)

### Bug Fixes

- **cms:** display unregistered content-types instead of error message ([#81](https://github.com/botpress/studio/issues/81)) ([d3370be](https://github.com/botpress/studio/commit/d3370be41630760ef5abd2625e6c227c70cff629))
- **dev:** fix condition ([235389d](https://github.com/botpress/studio/commit/235389d3566b2df29c0244b954c9682dd372c1f5))
- **flow:** fix clearing node action parameters on close ([#91](https://github.com/botpress/studio/issues/91)) ([5ffbb9a](https://github.com/botpress/studio/commit/5ffbb9a191a6e1b2e0d702c8729b1746606e1b98))
- **studio:** bot mig same behavior as core ([#86](https://github.com/botpress/studio/issues/86)) ([6fd2bdc](https://github.com/botpress/studio/commit/6fd2bdcfdcab7468d68be7297e393559df4abcba))
- **studio:** overlapping between search bar & node props side panel ([#37](https://github.com/botpress/studio/issues/37)) ([6e4d841](https://github.com/botpress/studio/commit/6e4d841cd83a0ecfb52d1d77d042a7c588b0fcfe))
- **studio-ui:** remove id from bot form parameters ([#90](https://github.com/botpress/studio/issues/90)) ([cffe305](https://github.com/botpress/studio/commit/cffe30525e83b4342344541268ae52fc207b2fcd))

### Features

- **dev:** binary branches ([#93](https://github.com/botpress/studio/issues/93)) ([51dd7ce](https://github.com/botpress/studio/commit/51dd7ce679456824f6b909a9d97525133dea49b5))

## [0.0.34](https://github.com/botpress/studio/compare/v0.0.33...v0.0.34) (2021-09-02)

### Bug Fixes

- **core:** fix redis pubsub by adding redis scopes ([#83](https://github.com/botpress/studio/issues/83)) ([2ed671f](https://github.com/botpress/studio/commit/2ed671fef6c6f0f6cca6c58a7df193ce9985286f))
- **debugger:** use message ids ([#30](https://github.com/botpress/studio/issues/30)) ([2fc6756](https://github.com/botpress/studio/commit/2fc67569d72188a6776805d0e9e1bc21066fb958))
- **studio:** fix typings for yn signature ([42c11e0](https://github.com/botpress/studio/commit/42c11e0c988e817384a8dda9f0a95a55b035b34a))

### Features

- improve content rtl support for nodes on botpress studio ([#61](https://github.com/botpress/studio/issues/61)) ([ae36c88](https://github.com/botpress/studio/commit/ae36c88af4fbddc3238529cf4824154714fca933))

## [0.0.33](https://github.com/botpress/studio/compare/v0.0.32...v0.0.33) (2021-08-20)

### Features

- **config:** Add bot id as readonly on bot config ([#64](https://github.com/botpress/studio/issues/64)) ([49cffc5](https://github.com/botpress/studio/commit/49cffc5836cdf0ef065f49ec0d4cb506a84466e4))

## [0.0.32](https://github.com/botpress/studio/compare/v0.0.31...v0.0.32) (2021-08-19)

### Bug Fixes

- **libraries:** fix inexistent folder ([74f8c01](https://github.com/botpress/studio/commit/74f8c016b83e71e2e59e78f37aaf46da8a856d91))

## [0.0.31](https://github.com/botpress/studio/compare/v0.0.30...v0.0.31) (2021-08-19)

### Bug Fixes

- **libraries:** more fix for distributed usage ([c22d9de](https://github.com/botpress/studio/commit/c22d9de9ebe9819e434abec837e1b53b244ad97a))

## [0.0.30](https://github.com/botpress/studio/compare/v0.0.29...v0.0.30) (2021-08-19)

### Bug Fixes

- **libraries:** updated logic to use disk first ([#63](https://github.com/botpress/studio/issues/63)) ([84ec937](https://github.com/botpress/studio/commit/84ec9378f0a60f5f2e2f9b6822facf16d42446a5))

## [0.0.29](https://github.com/botpress/studio/compare/v0.0.28...v0.0.29) (2021-08-19)

### Bug Fixes

- **studio:** fix delete nodes link issue ([#62](https://github.com/botpress/studio/issues/62)) ([52ff16e](https://github.com/botpress/studio/commit/52ff16e970504106ee085e07285baf4abd9b401f))
- **studio:** move events-related routes ([#56](https://github.com/botpress/studio/issues/56)) ([ccf010f](https://github.com/botpress/studio/commit/ccf010f2b81e2e6aca8ee5b876e84d5f1bde0e2a))
- **studio:** Ui changes ([#40](https://github.com/botpress/studio/issues/40)) ([a36be1b](https://github.com/botpress/studio/commit/a36be1b8fa02b6e324e957e1a9a3dd888d28641d))

## [0.0.28](https://github.com/botpress/studio/compare/v0.0.27...v0.0.28) (2021-08-18)

### Bug Fixes

- **studio:** guided tour highlighting restored and more ([#44](https://github.com/botpress/studio/issues/44)) ([5793df7](https://github.com/botpress/studio/commit/5793df7601dad375b626fa57d42eff1119038f8a))

### Features

- **studio:** add bot-scoped libraries ([#34](https://github.com/botpress/studio/issues/34)) ([5b20b23](https://github.com/botpress/studio/commit/5b20b23a3371eba0b7817c4b1884a58279c17b4d))

## [0.0.27](https://github.com/botpress/studio/compare/v0.0.26...v0.0.27) (2021-08-17)

### Bug Fixes

- Swapped flow and content menu items in side menu ([#54](https://github.com/botpress/studio/issues/54)) ([113cf35](https://github.com/botpress/studio/commit/113cf3559c1edfa998b094fd67cea0fa0283b451))

### Features

- **studio:** implement bot migration ([#31](https://github.com/botpress/studio/issues/31)) ([d82f9c2](https://github.com/botpress/studio/commit/d82f9c2c835e6b5da9b87877ae598a744eae6295))

## [0.0.26](https://github.com/botpress/studio/compare/v0.0.25...v0.0.26) (2021-08-11)

### Features

- **qna:** extract module qna on studio ([#29](https://github.com/botpress/studio/issues/29)) ([7ed09fa](https://github.com/botpress/studio/commit/7ed09fa383d6b7fbcf171f9ee0f38fc8aa93fc3f))

## [0.0.25](https://github.com/botpress/studio/compare/v0.0.24...v0.0.25) (2021-08-11)

### Bug Fixes

- **studio:** don't open node props when moving it ([#35](https://github.com/botpress/studio/issues/35)) ([7dd773d](https://github.com/botpress/studio/commit/7dd773d4a9b14783c86c414e39292ad3b9e7a25e))
- **studio:** UI toast modifications ([#27](https://github.com/botpress/studio/issues/27)) ([53feee2](https://github.com/botpress/studio/commit/53feee2761917bdc182007cc2f9adc5a277bb087))

### Features

- **studio:** Custom Icon for Conversation End Flows ([#36](https://github.com/botpress/studio/issues/36)) ([1e4350c](https://github.com/botpress/studio/commit/1e4350cd99a0e1f27f5a208cefd4d76c7dd96e44))

## [0.0.24](https://github.com/botpress/studio/compare/v0.0.23...v0.0.24) (2021-07-30)

### Bug Fixes

- **core:** fix disk storage race condition ([#28](https://github.com/botpress/studio/issues/28)) ([4bc8455](https://github.com/botpress/studio/commit/4bc8455487e7a6e312166aa54bb6611474f85fe6))

## [0.0.23](https://github.com/botpress/studio/compare/v0.0.22...v0.0.23) (2021-07-13)

### Bug Fixes

- **config:** cannot save config ([d5354cc](https://github.com/botpress/studio/commit/d5354ccd5b2c821f49364df74c21358c1e4a664e))

## [0.0.22](https://github.com/botpress/studio/compare/v0.0.21...v0.0.22) (2021-06-28)

### Bug Fixes

- make sure each contentItem is matching it's id ([#25](https://github.com/botpress/studio/issues/25)) ([275c0df](https://github.com/botpress/studio/commit/275c0df5c1c1199f9eeec37862cc5fca1832fc6e))

### Features

- **studio:** add support for help/hints with content form ([4c6691a](https://github.com/botpress/studio/commit/4c6691ab3c147625f83d62a554217e1e476df29d))
- **studio:** add support for help/hints with content form ([75f5db7](https://github.com/botpress/studio/commit/75f5db76fc56b86738572faf5194020042082679))

## [0.0.21](https://github.com/botpress/studio/compare/v0.0.20...v0.0.21) (2021-06-15)

## [0.0.20](https://github.com/botpress/studio/compare/v0.0.19...v0.0.20) (2021-06-10)

### Bug Fixes

- **core:** fix module paths ([#17](https://github.com/botpress/studio/issues/17)) ([0e4d397](https://github.com/botpress/studio/commit/0e4d3970c6c19e09dde19ccc20fff5b307e21403))

## [0.0.19](https://github.com/botpress/studio/compare/v0.0.18...v0.0.19) (2021-06-09)

### Bug Fixes

- **studio:** add db logger ([#16](https://github.com/botpress/studio/issues/16)) ([029f574](https://github.com/botpress/studio/commit/029f574965e847998ef5a55c18e3c74ae26f8ad7))

## [0.0.18](https://github.com/botpress/studio/compare/v0.0.16...v0.0.18) (2021-06-09)

## [0.0.16](https://github.com/botpress/studio/compare/v0.0.15...v0.0.16) (2021-06-03)

### Bug Fixes

- **core:** issue with cms on cluster ([14b9fff](https://github.com/botpress/studio/commit/14b9fff74dc4640b1b992f015391729c7b927870))

## [0.0.15](https://github.com/botpress/studio/compare/v0.0.14...v0.0.15) (2021-06-03)

## [0.0.14](https://github.com/botpress/studio/compare/v0.0.13...v0.0.14) (2021-06-03)

## [0.0.13](https://github.com/botpress/studio/compare/v0.0.12...v0.0.13) (2021-06-03)

### Bug Fixes

- **core:** warn parent process of readiness ([1836d81](https://github.com/botpress/studio/commit/1836d811fcc73fe95d66650edb950bb49fd4d2af))
- **studio:** url is less visible in logs ([#11](https://github.com/botpress/studio/issues/11)) ([bc5706a](https://github.com/botpress/studio/commit/bc5706a2cfa6ee0ab4697e7ece42f59085ca17f7))

## [0.0.12](https://github.com/botpress/studio/compare/v0.0.11...v0.0.12) (2021-06-02)

### Bug Fixes

- **build:** fix build again ([#9](https://github.com/botpress/studio/issues/9)) ([ffc36af](https://github.com/botpress/studio/commit/ffc36af9fc735c6b24ff0246de2f56d63feb20e1))

## [0.0.11](https://github.com/botpress/studio/compare/v0.0.10...v0.0.11) (2021-06-02)

### Bug Fixes

- **build:** fix packaging ([#8](https://github.com/botpress/studio/issues/8)) ([994ad1f](https://github.com/botpress/studio/commit/994ad1f1dc72927cd554afe9c5c7bd4f3fac475c))

## [0.0.10](https://github.com/botpress/studio/compare/v0.0.9...v0.0.10) (2021-06-01)

### Bug Fixes

- **build:** missing native ext ([#6](https://github.com/botpress/studio/issues/6)) ([971f201](https://github.com/botpress/studio/commit/971f201399d92cf7147d8ef62894c32b43d6cd70))

## [0.0.9](https://github.com/botpress/studio/compare/v0.0.8...v0.0.9) (2021-06-01)

### Bug Fixes

- **dx:** fix changelog defaults ([2de4d51](https://github.com/botpress/studio/commit/2de4d5143582d2bf3c985aac4bacd2ec47cb3c09))
- **dx:** fix changelog defaults ([4a14377](https://github.com/botpress/studio/commit/4a1437776cea9030866d2b6fe0da6042cdc11159))
- **studio:** fix job service and invalidations ([dea25ba](https://github.com/botpress/studio/commit/dea25ba68e6bbea9c0b6f6fa0295e1f8ca8ba0d5))
- **studio:** update version ([#4](https://github.com/botpress/studio/issues/4)) ([36450f6](https://github.com/botpress/studio/commit/36450f6742a53c7fda2d10539a171a7735e64abc))

## [0.0.8](https://github.com/botpress/studio/compare/v0.0.7...v0.0.8) (2021-05-27)

## [0.0.7](https://github.com/botpress/studio/compare/v0.0.6...v0.0.7) (2021-05-26)

### Bug Fixes

- **studio:** disk invalidations must be from core ([33c207b](https://github.com/botpress/studio/commit/33c207b4749a27c09990d404680f06a4c64aed68))

## [0.0.6](https://github.com/botpress/studio/compare/v0.0.5...v0.0.6) (2021-05-26)

## [0.0.5](https://github.com/botpress/studio/compare/v0.0.4...v0.0.5) (2021-05-26)

## [0.0.4](https://github.com/botpress/studio/compare/v0.0.3...v0.0.4) (2021-05-26)

## [0.0.3](https://github.com/botpress/studio/compare/v0.0.2...v0.0.3) (2021-05-26)

## [0.0.2](https://github.com/botpress/studio/compare/v0.0.1...v0.0.2) (2021-05-25)

## [0.0.1](https://github.com/botpress/studio/compare/0.0.1...v0.0.1) (2021-05-21)

## 0.0.1 (2021-05-20)

## [0.0.33](https://github.com/botpress/studio/compare/v0.0.32...v0.0.33) (2021-08-20)

### Features

- **config:** Add bot id as readonly on bot config ([49cffc5](https://github.com/botpress/studio/commit/49cffc5836cdf0ef065f49ec0d4cb506a84466e4))

## [0.0.31](https://github.com/botpress/studio/compare/v0.0.30...v0.0.31) (2021-08-19)

### Bug Fixes

- **libraries:** updated logic to use disk first ([f42a3eb](https://github.com/botpress/studio/commit/f42a3eb67f512aab181df598ed832b810b7f9faf))

## [0.0.26](https://github.com/botpress/studio/compare/v0.0.23...v0.0.26) (2021-08-16)

### Features

- **studio:** implement bot migration ([89a3a0a](https://github.com/botpress/studio/commit/89a3a0ae6a56484bfcffe3e744f1b4405b62ab1f))

## [0.0.21](https://github.com/botpress/studio/compare/v0.0.20...v0.0.21) (2021-06-16)

## [0.0.17](https://github.com/botpress/studio/compare/v0.0.16...v0.0.17) (2021-06-09)

## [0.0.13](https://github.com/botpress/studio/compare/v0.0.12...v0.0.13) (2021-06-03)

### Bug Fixes

- **core:** warn parent process of readiness ([1836d81](https://github.com/botpress/studio/commit/1836d811fcc73fe95d66650edb950bb49fd4d2af))

## [0.0.9](https://github.com/botpress/studio/compare/v0.0.8...v0.0.9) (2021-06-01)

### Bug Fixes

- **dx:** fix changelog defaults ([4a14377](https://github.com/botpress/studio/commit/4a1437776cea9030866d2b6fe0da6042cdc11159))
- **studio:** fix job service and invalidations ([dea25ba](https://github.com/botpress/studio/commit/dea25ba68e6bbea9c0b6f6fa0295e1f8ca8ba0d5))
