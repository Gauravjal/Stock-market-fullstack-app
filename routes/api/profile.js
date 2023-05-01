const express=require('express')
//connect to express router
const router=express.Router();
const auth=require('../../middleware/auth')
const Profile =require('../../models/Profile')
const {check,validationResult}=require('express-validator');
const User =require('../../models/User');
const path = require('path');
// Set storage engine for Multer


//GET api/profile/me
//Get current users profile
//private route
router.get('/me',auth,async(req,res)=>{
    try{
        //find profile of user
        const profile=await Profile.findOne({user:req.user.id}).populate('user',['username','avatar']);
        if(!profile){
            return res.status(400).json({
                //If there is no profile data then display this message
                msg:'There is no profile data for this user'
            })
        }
        res.json(profile);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    // res.send('Profile route');
})

//POST 
//Create or update profile
//private route\
router.post(
    '/',[
    auth,
    [
        //check if status and skills are not empty
        check('status','Status is required').not().isEmpty(),
        check('skills','Skills is required').not().isEmpty()
    ]
    ],
    async(req,res)=>{
        const errors=validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        const {
            company,
            website,
            location,
            bio,
            mobile,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        }=req.body;

        //Build profile object
        const profileFields={};
        profileFields.user=req.user.id;
        if(company)profileFields.company=company;
        if(website)profileFields.website=website;
        if(location)profileFields.location=location;
        if(bio)profileFields.bio=bio;
        if(mobile)profileFields.mobile=mobile;
        if(status)profileFields.status=status;
        if(githubusername)profileFields.githubusername=githubusername;
        //convert skills into array
        if(skills)profileFields.skills=skills.split(',').map((skills=>skills.trim()));
        
        console.log(profileFields.skills);

        //Build social profile object
        profileFields.social={}
        if(youtube) profileFields.social.youtube=youtube;
        if(twitter) profileFields.social.twitter=twitter;
        if(facebook) profileFields.social.facebook=facebook;
        if(linkedin) profileFields.social.linkedin=linkedin;
        if(instagram) profileFields.social.instagram=instagram;

        try{
            let profile=await Profile.findOne({user:req.user.id});
            if(profile){
                //update profile
                profile=await Profile.findOneAndUpdate(
                    {
                        user:req.user.id
                    },
                    {
                        $set:profileFields
                    },
                    {
                        new:true
                    }
                );
                return res.json(profile);
            }
            //Create a new profile if not found
            console.log(profileFields)
            profile=new Profile(profileFields);
            await profile.save();
            res.json(profile);
        }
        catch(err)
        {
            console.error(err.message);
            res.status(500);//.send('Server Error');
        }
    }
)

//@route    GET api/profile
//@desc     Get all profiles
//@access   public

router.get('/',async(req,res)=>{
    try{
        const profiles=await Profile.find().populate('user',['username','avatar']);
        res.json(profiles);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

)
//@route    GET api/profile/propularUser
router.get('/popularUser',auth,async(req,res)=>{
    try{
        const profiles=await Profile.find({user:{$ne:req.user.id}}).populate('user',['username','avatar']);
        res.json(profiles);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


// @get a pirticular profile
router.get('/getprofile/:id',async(req,res)=>{
    try{
        const id = req.params.id;
        const profiles=await Profile.find({_id:id}).populate('user',['username','avatar']);
        res.json(profiles);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
//@route GET all user profiles
router.get('/users',async(req,res)=>{
    try{
        const users=await User.find({})
        res.json(users);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

)






//@route    GET api/profile/user/:user_id
//@desc     Get profile by user id
//@access   public

router.get('/user/:user_id',async(req,res)=>{
    try{
        const profile=await Profile.findOne({
            user:req.params.user_id
        }).populate('user',['username','avatar']);
        if(!profile)
        return res.status(400).json({
            msg:'There is no profile for this user'
        });
        res.json(profile);
    }
    catch(err){
        if(err.kind=='ObjectId')
        return res.status(400).json({
            msg:'User not found'
        });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

)

//@route    DELETE api/profile
//@desc     Delete profile, user & posts
//@access   private

router.delete('/users/:user_id',async(req,res)=>{
    try{
        // console.log(req.params.user_id)
        // const deletedUser = await User.findByIdAndDelete(req.params.user_id);
        await Profile.findOneAndRemove({
            user:req.params.user_id
        });
        console.log(req.params)
        await User.findOneAndRemove({_id:req.params.user_id});
        res.json({msg:'User deleted'});
    }
    catch(err){
        if(err.kind=='ObjectId')
        return res.status(400).json({
            msg:'User not found'
        });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

)


//@route    PUT api/profile/experience
//@desc     Add profile experience
//@access   private

router.put('/experience',[auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()
]],async(req,res)=>{
    try{
        const errors=validationResult(req);
        if(!errors.isEmpty())
        {
            return res.status(400).json({errors:errors.array()});
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }=req.body;
        const newExp={
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try{
            const profile=await Profile.findOne({
                user:req.user.id
            });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
        } catch(err){
            console.error(err.message);
            res.status(500).send();
        }
    }
    catch(err){
        if(err.kind=='ObjectId')
        return res.status(400).json({
            msg:'User not found'
        });
    
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

)

//@route    DELETE api/profile/experience/:edu_id
//@desc     Delete experience from profile
//@access   private
router.delete('/experience/:edu_id',auth,async(req,res)=>{
    try{
        const profile=await Profile.findOne({
            user:req.user.id
        });
        const removeIndex=profile.experience.map(item=>item.id).indexOf(req.params.edu_id);
        profile.experience.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})



//@route    PUT api/profile/education
//@desc     Add profile education
//@access   private

router.put('/education',[auth,[
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','From is required').not().isEmpty()
]],async(req,res)=>{
    try{
        const errors=validationResult(req);
        console.log("check",errors);
        if(!errors.isEmpty())
        {
            return res.status(400).json({errors:errors.array()});
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }=req.body;
        const newEdu={
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try{
            const profile=await Profile.findOne({
                user:req.user.id
            });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch(err){
            console.error(err.message);
            res.status(500).send();
        }
    }
    catch(err){
        if(err.kind=='ObjectId')
        return res.status(400).json({
            msg:'User not found'
        });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

)

//@route    DELETE api/profile/education/:edu_id
//@desc     Delete education from profile
//@access   private
router.delete('/education/:edu_id',auth,async(req,res)=>{
    try{
        const profile=await Profile.findOne({
            user:req.user.id
        });
        const removeIndex=profile.education.map(item=>item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
//export route
module.exports=router;