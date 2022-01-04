// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import {Route, Router, Set} from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'
import ChallengeProfilePage from './pages/ChallengeProfilePage/ChallengeProfilePage'
import SignUpLayout from './pages/SignUp/SignUpLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={AppLayout}>
        <Route path="/profiles" page={ProfilesPage} name="profiles" />
        <Route path="/profiles/{id}" page={ProfilePage} name="profile" />
        <Route path="/profiles/{id}/challenge" page={ChallengeProfilePage} name="challengeProfile" />

        <Route path="/unsubmitted-profiles" page={UnsubmittedProfilesPage} name="unsubmittedProfiles" />
        <Route path="/create-connection" page={CreateConnectionPage} name="createConnection" />
        <Route path="/test-transaction" page={TestTransactionPage} name="testTransaction" />
        <Route notfound page={NotFoundPage} />
        <Set wrap={SignUpLayout}>
          <Route path="/sign-up/{purposeIdentifier}/{externalAddress}" page={SignUpIntroPage} name="signUpAndconnect" />
          <Route path="/sign-up" page={SignUpIntroPage} name="signUpIntro" />
          <Route path="/sign-up/create-profile" page={CreateProfilePage} name="createProfile" />
        </Set>
      </Set>
    </Router>
  )
}

export default Routes
